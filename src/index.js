import colors from '@colors/colors/safe.js';
import Table from 'cli-table3';
import hljs from 'highlight.js';
import emojiData from 'emojilib/simplemap.json' with { type: 'json' };
import supportsHyperlinks from 'supports-hyperlinks';
import stringWidth from 'string-width';

const escapeRegExp = (string) =>
  string.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');

const TABLE_CELL_SPLIT = '^*||*^';
const TABLE_ROW_WRAP = '*|*|*|*';
const TABLE_ROW_WRAP_REGEXP = new RegExp(escapeRegExp(TABLE_ROW_WRAP), 'g');

const COLON_REPLACER = '*#COLON|*';
const COLON_REPLACER_REGEXP = new RegExp(escapeRegExp(COLON_REPLACER), 'g');

const TAB_ALLOWED_CHARACTERS = ['\t'];

// HARD_RETURN holds a character sequence used to indicate text has a
// hard (no-reflowing) line break.  Previously \r and \r\n were turned
// into \n in marked's lexer- preprocessing step. So \r is safe to use
// to indicate a hard (non-reflowed) return.
const HARD_RETURN = '\r';
const HARD_RETURN_RE = new RegExp(HARD_RETURN);
const HARD_RETURN_GFM_RE = new RegExp(`${HARD_RETURN}|<br />`);

const BULLET_POINT = '* ';
const BULLET_POINT_REGEX = '\\*';
const NUMBERED_POINT_REGEX = '\\d+\\.';
const POINT_REGEX = `(?:${BULLET_POINT_REGEX}|${NUMBERED_POINT_REGEX})`;

// Prevents nested lists from joining their parent list's last line
const fixNestedLists = (body, indent) =>
  body.replace(
    new RegExp(`(\\S(?: |  )?)((?:${indent})+)(${POINT_REGEX}(?:.*)+)$`, 'gm'),
    `$1\n${indent}$2$3`
  );

const isPointedLine = (line, indent) =>
  line.match(`^(?:${indent})*${POINT_REGEX}`);

const toSpaces = (string) => ' '.repeat(string.length);

const bulletPointLine = (indent, line) =>
  isPointedLine(line, indent) ? line : `${toSpaces(BULLET_POINT)}${line}`;

const bulletPointLines = (lines, indent) =>
  lines
    .split('\n')
    .filter(String)
    .map((line) => bulletPointLine(indent, line))
    .join('\n');

const numberedLine = (indent, line, number) =>
  isPointedLine(line, indent)
    ? {
        number: number + 1,
        line: line.replace(BULLET_POINT, `${number + 1}. `)
      }
    : {
        number: number,
        line: toSpaces(`${number}. `) + line
      };

const numberedLines = (lines, indent) => {
  let number = 0;
  return lines
    .split('\n')
    .filter(String)
    .map((line) => {
      const numbered = numberedLine(indent, line, number);
      number = numbered.number;
      return numbered.line;
    })
    .join('\n');
};

const list = (body, ordered, indent) => {
  body = body.trim();
  return ordered ? numberedLines(body, indent) : bulletPointLines(body, indent);
};

const defaultOptions = {
  code: colors.yellow,
  blockquote: colors.gray.italic,
  html: colors.gray,
  heading: colors.green.bold,
  firstHeading: colors.magenta.underline.bold,
  hr: colors.reset,
  listitem: colors.reset,
  list: list,
  table: colors.reset,
  paragraph: colors.reset,
  strong: colors.bold,
  em: colors.italic,
  codespan: colors.yellow,
  del: colors.dim.gray.strikethrough,
  link: colors.blue,
  href: colors.blue.underline,
  text: String,
  unescape: true,
  emoji: true,
  width: 80,
  showSectionPrefix: true,
  reflowText: false,
  tab: 4
};

const defaultHighlightTheme = {
  keyword: colors.blue,
  built_in: colors.cyan,
  type: colors.cyan.dim,
  literal: colors.blue,
  number: colors.green,
  regexp: colors.red,
  string: colors.red,
  subst: String,
  symbol: String,
  class: colors.blue,
  function: colors.yellow,
  title: String,
  params: String,
  comment: colors.green,
  doctag: colors.green,
  meta: colors.gray,
  'meta-keyword': String,
  'meta-string': String,
  section: String,
  tag: colors.gray,
  name: colors.blue,
  'builtin-name': String,
  attr: colors.cyan,
  attribute: String,
  variable: String,
  bullet: String,
  code: String,
  emphasis: colors.italic,
  strong: colors.bold,
  formula: String,
  link: colors.underline,
  quote: String,
  'selector-tag': String,
  'selector-id': String,
  'selector-class': String,
  'selector-attr': String,
  'selector-pseudo': String,
  'template-tag': String,
  'template-variable': String,
  addition: colors.green,
  deletion: colors.red,
  default: String
};

const fixHardReturn = (text, reflow) => reflow ? text.replace(HARD_RETURN, /\n/g) : text;

// Munge \n's and spaces in "text" so that the number of
// characters between \n's is less than or equal to "width".
const reflowText = (text, width, gfm) => {
  // Hard break was inserted by TerminalRenderer.prototype.br or is
  // <br /> when gfm is true
  const splitRegex = gfm ? HARD_RETURN_GFM_RE : HARD_RETURN_RE;
  const sections = text.split(splitRegex);
  const reflowed = [];

  for (const section of sections) {
    // Split the section by escape codes so that we can
    // deal with them separately.
    const fragments = section.split(/(\u001b\[(?:\d{1,3})(?:;\d{1,3})*m)/g);
    let column = 0;
    let currentLine = '';
    let lastWasEscapeCharacter = false;

    while (fragments.length) {
      const fragment = fragments[0];

      if (fragment === '') {
        fragments.splice(0, 1);
        lastWasEscapeCharacter = false;
        continue;
      }

      // This is an escape code - leave it whole and
      // move to the next fragment.
      if (!stringWidth(fragment)) {
        currentLine += fragment;
        fragments.splice(0, 1);
        lastWasEscapeCharacter = true;
        continue;
      }

      const words = fragment.split(/[ \t\n]+/);

      for (let i = 0; i < words.length; i++) {
        let word = words[i];
        let addSpace = column != 0;
        if (lastWasEscapeCharacter) {
          addSpace = false;
        }

        // If adding the new word overflows the required width
        if (column + word.length + addSpace > width) {
          if (word.length <= width) {
            // If the new word is smaller than the required width
            // just add it at the beginning of a new line
            reflowed.push(currentLine);
            currentLine = word;
            column = word.length;
          } else {
            // If the new word is longer than the required width
            // split this word into smaller parts.
            const w = word.slice(0, width - column - Number(addSpace));
            if (addSpace) {
              currentLine += ' ';
            }
            currentLine += w;
            reflowed.push(currentLine);
            currentLine = '';
            column = 0;

            word = word.slice(w.length);
            while (word.length) {
              const w = word.slice(0, width);

              if (!w.length) {
                break;
              }

              if (w.length < width) {
                currentLine = w;
                column = w.length;
                break;
              } else {
                reflowed.push(w);
                word = word.slice(width);
              }
            }
          }
        } else {
          if (addSpace) {
            currentLine += ' ';
            column++;
          }

          currentLine += word;
          column += word.length;
        }

        lastWasEscapeCharacter = false;
      }

      fragments.splice(0, 1);
    }

    if (stringWidth(currentLine)) {
      reflowed.push(currentLine);
    }
  }

  return reflowed.join('\n');
};

const indentLines = (indent, text) =>
  text.replace(/(^|\n)(.+)/g, `$1${indent}$2`);

const indentify = (indent, text) =>
  text ? `${indent}${text.split('\n').join(`\n${indent}`)}` : text;

const colorizeHighlightNode = (node, theme, isTop) => {
  if (typeof node === 'string') {
    return isTop
      ? (theme.default ?? defaultHighlightTheme.default ?? String)(node)
      : node;
  }

  if (node.kind) {
    const colorized = node.children
      .map((n) => colorizeHighlightNode(n, theme, false))
      .join('');
    return (theme[node.kind] ?? defaultHighlightTheme[node.kind] ?? String)(
      colorized
    );
  }

  return node.children
    .map((n) => colorizeHighlightNode(n, theme, true))
    .join('');
};

const highlight = (code, language, options) => {
  if (!colors.enabled) {
    return code;
  }

  code = fixHardReturn(code, options.reflowText);

  if (language) {
    try {
      const { theme = {}, ignoreIllegals } = options.highlightOptions ?? {};
      const result = hljs.highlight(code, {
        ignoreIllegals,
        language
      });
      const nodes = result.emitter.rootNode;
      return colorizeHighlightNode(nodes, theme, false);
    } catch {}
  }

  return options.code(code);
};

const section = (text) => `${text}\n\n`;

const insertEmojis = (text) =>
  text.replace(/:([A-Za-z0-9_\-\+]+?):/g, (emojiString) => {
    const emojiSign = emojiData[emojiString.slice(1, -1)];
    return emojiSign ? `${emojiSign} ` : emojiString;
  });

const hr = (separatorCharacter, length) => {
  length ||= globalThis.process?.stdout?.columns ?? 80;
  return separatorCharacter.repeat(length - 1);
};

const undoColon = (string) => string.replace(COLON_REPLACER_REGEXP, ':');

const generateTableRow = (text, escaper = String) => {
  if (!text) {
    return [];
  }

  const lines = escaper(text).split('\n');
  const data = [];

  for (const line of lines) {
    if (line) {
      data.push(
        line
          .replace(TABLE_ROW_WRAP_REGEXP, '')
          .split(TABLE_CELL_SPLIT)
          .slice(0, -1)
      );
    }
  }

  return data;
};

const unescapeEntities = (html) =>
  html
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

const compose =
  (...functions) =>
  (...arguments_) => {
    let index = functions.length;
    for (; index-- > 0; ) {
      arguments_ = [functions[index](...arguments_)];
    }
    return arguments_[0];
  };

const sanitizeTab = (tab, fallbackTab) => {
  if (typeof tab === 'number') {
    return ' '.repeat(tab);
  } else if (
    typeof tab === 'string' &&
    TAB_ALLOWED_CHARACTERS.some((character) => tab.match(`^(${character})+$`))
  ) {
    return tab;
  } else {
    return ' '.repeat(fallbackTab);
  }
};

class TerminalRenderer {
  constructor(options = {}) {
    this.markedTerminalOptions = { ...defaultOptions, ...options };
    this.tab = sanitizeTab(this.markedTerminalOptions.tab, defaultOptions.tab);
    this.emoji = this.markedTerminalOptions.emoji ? insertEmojis : String;
    this.unescape = this.markedTerminalOptions.unescape
      ? unescapeEntities
      : String;
    this.transform = compose(undoColon, this.unescape, this.emoji);
  }

  space() {
    return '';
  }

  text(text) {
    if (typeof text === 'object') {
      text = text.tokens ? this.parser.parseInline(text.tokens) : text.text;
    }

    return this.markedTerminalOptions.text(text);
  }

  code(code, language, escaped) {
    if (typeof code === 'object') {
      language = code.lang;
      escaped = !!code.escaped;
      code = code.text;
    }

    return section(
      indentify(this.tab, highlight(code, language, this.markedTerminalOptions))
    );
  }

  blockquote(quote) {
    if (typeof quote === 'object') {
      quote = this.parser.parse(quote.tokens);
    }

    return section(
      this.markedTerminalOptions.blockquote(indentify(this.tab, quote.trim()))
    );
  }

  html(html) {
    if (typeof html === 'object') {
      html = html.text;
    }

    return this.markedTerminalOptions.html(html);
  }

  heading(text, level) {
    if (typeof text === 'object') {
      level = text.depth;
      text = this.parser.parseInline(text.tokens);
    }
    text = this.transform(text);

    const prefix = this.markedTerminalOptions.showSectionPrefix
      ? `${'#'.repeat(level)} `
      : '';
    text = `${prefix}${text}`;

    if (this.markedTerminalOptions.reflowText) {
      text = reflowText(
        text,
        this.markedTerminalOptions.width,
        this.options.gfm
      );
    }

    return section(
      level === 1
        ? this.markedTerminalOptions.firstHeading(text)
        : this.markedTerminalOptions.heading(text)
    );
  }

  hr() {
    return section(
      this.markedTerminalOptions.hr(
        hr(
          '-',
          this.markedTerminalOptions.reflowText &&
            this.markedTerminalOptions.width
        )
      )
    );
  }

  list(body, ordered) {
    if (typeof body === 'object') {
      const listToken = body;
      const start = listToken.start;
      const loose = listToken.loose;

      ordered = listToken.ordered;
      body = '';
      for (let j = 0; j < listToken.items.length; j++) {
        body += this.listitem(listToken.items[j]);
      }
    }

    body = this.markedTerminalOptions.list(body, ordered, this.tab);
    return section(fixNestedLists(indentLines(this.tab, body), this.tab));
  }

  listitem(text) {
    if (typeof text === 'object') {
      const item = text;
      text = '';
      if (item.task) {
        const checkbox = this.checkbox({ checked: !!item.checked });
        if (item.loose) {
          if (item.tokens.length > 0 && item.tokens[0].type === 'paragraph') {
            item.tokens[0].text = `${checkbox} ${item.tokens[0].text}`;
            if (
              item.tokens[0].tokens &&
              item.tokens[0].tokens.length > 0 &&
              item.tokens[0].tokens[0].type === 'text'
            ) {
              item.tokens[0].tokens[0].text = `${checkbox} ${item.tokens[0].tokens[0].text}`;
            }
          } else {
            item.tokens.unshift({
              type: 'text',
              raw: `${checkbox} `,
              text: `${checkbox} `
            });
          }
        } else {
          text += `${checkbox} `;
        }
      }

      text += this.parser.parse(item.tokens, !!item.loose);
    }
    const transform = compose(
      this.markedTerminalOptions.listitem,
      this.transform
    );
    const isNested = text.indexOf('\n') !== -1;
    if (!isNested) text = transform(text);

    // Use BULLET_POINT as a marker for ordered or unordered list item
    return `\n${BULLET_POINT}${text}`;
  }

  checkbox(checked) {
    if (typeof checked === 'object') {
      checked = checked.checked;
    }

    return `[${checked ? 'X' : ' '}] `;
  }

  paragraph(text) {
    if (typeof text === 'object') {
      text = this.parser.parseInline(text.tokens);
    }

    const transform = compose(
      this.markedTerminalOptions.paragraph,
      this.transform
    );
    text = transform(text);
    if (this.markedTerminalOptions.reflowText) {
      text = reflowText(
        text,
        this.markedTerminalOptions.width,
        this.options.gfm
      );
    }

    return section(text);
  }

  table(header, body) {
    if (typeof header === 'object') {
      const token = header;
      header = '';

      // header
      let cell = '';
      for (let j = 0; j < token.header.length; j++) {
        cell += this.tablecell(token.header[j]);
      }
      header += this.tablerow({ text: cell });

      body = '';
      for (let j = 0; j < token.rows.length; j++) {
        const row = token.rows[j];

        cell = '';
        for (let k = 0; k < row.length; k++) {
          cell += this.tablecell(row[k]);
        }

        body += this.tablerow({ text: cell });
      }
    }

    const table = new Table({
      ...(this.markedTerminalOptions.tableOptions ?? {}),
      head: generateTableRow(header)[0]
    });

    const rows = generateTableRow(body, this.transform);
    for (const row of rows) {
      table.push(row);
    }

    return section(this.markedTerminalOptions.table(table.toString()));
  }

  tablerow(content) {
    if (typeof content === 'object') {
      content = content.text;
    }

    return `${TABLE_ROW_WRAP}${content}${TABLE_ROW_WRAP}\n`;
  }

  tablecell(content) {
    if (typeof content === 'object') {
      content = this.parser.parseInline(content.tokens);
    }

    return `${content}${TABLE_CELL_SPLIT}`;
  }

  // span level renderer
  strong(text) {
    if (typeof text === 'object') {
      text = this.parser.parseInline(text.tokens);
    }

    return this.markedTerminalOptions.strong(text);
  }

  em(text) {
    if (typeof text === 'object') {
      text = this.parser.parseInline(text.tokens);
    }

    text = fixHardReturn(text, this.markedTerminalOptions.reflowText);
    return this.markedTerminalOptions.em(text);
  }

  codespan(text) {
    if (typeof text === 'object') {
      text = text.text;
    }

    text = fixHardReturn(text, this.markedTerminalOptions.reflowText);
    return this.markedTerminalOptions.codespan(
      text.replace(/:/g, COLON_REPLACER)
    );
  }

  br() {
    return this.markedTerminalOptions.reflowText ? HARD_RETURN : '\n';
  }

  del(text) {
    if (typeof text === 'object') {
      text = this.parser.parseInline(text.tokens);
    }

    return this.markedTerminalOptions.del(text);
  }

  link(href, title, text) {
    if (typeof href === 'object') {
      title = href.title;
      text = this.parser.parseInline(href.tokens);
      href = href.href;
    }

    if (this.options.sanitize) {
      let prot;
      try {
        prot = decodeURIComponent(unescape(href))
          .replace(/[^\w:]/g, '')
          .toLowerCase();
      } catch {
        return '';
      }

      if (prot.indexOf('javascript:') === 0) {
        return '';
      }
    }

    const hasText = text && text !== href;
    let out = '';

    if (supportsHyperlinks.stdout) {
      let link = this.markedTerminalOptions.href(
        text ? this.emoji(text) : href
      );
      // textLength breaks on '+' in URLs
      out = `\u001B]8;;${href.replace(/\+/g, '%20')}\u0007${link}\u001B]8;;\u0007`;
    } else {
      if (hasText) {
        out += `${this.emoji(text)} (`;
      }
      out += this.markedTerminalOptions.href(href);
      if (hasText) {
        out += ')';
      }
    }

    return this.markedTerminalOptions.link(out);
  }

  image(href, title, text) {
    if (typeof href === 'object') {
      title = href.title;
      text = href.text;
      href = href.href;
    }

    if (typeof this.markedTerminalOptions.image === 'function') {
      return this.markedTerminalOptions.image(href, title, text);
    }

    let out = `![${text}`;
    if (title) {
      out += ` – ${title}`;
    }

    return `${out}](${href})\n`;
  }
}

const functions = [
  'text',
  'code',
  'blockquote',
  'html',
  'heading',
  'hr',
  'list',
  'listitem',
  'checkbox',
  'paragraph',
  'table',
  'tablerow',
  'tablecell',
  'strong',
  'em',
  'codespan',
  'br',
  'del',
  'link',
  'image'
];

const markedTerminal = (options) => {
  const renderer = new TerminalRenderer(options);

  return {
    renderer: Object.fromEntries(
      functions.map((function_) => [
        function_,
        function (...arguments_) {
          renderer.options = this.options;
          renderer.parser = this.parser;
          return renderer[function_](...arguments_);
        }
      ])
    ),
    useNewRenderer: true
  };
}

export { TerminalRenderer, markedTerminal };

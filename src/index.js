import colors from '@colors/colors/safe.js';
import Table from 'cli-table3';
import hljs from 'highlight.js';
import emojilib from 'emojilib';
import supportsHyperlinks from 'supports-hyperlinks';
import textLength from 'string-width';

const TABLE_CELL_SPLIT = '^*||*^';
const TABLE_ROW_WRAP = '*|*|*|*';
const TABLE_ROW_WRAP_REGEXP = new RegExp(escapeRegExp(TABLE_ROW_WRAP), 'g');

const COLON_REPLACER = '*#COLON|*';
const COLON_REPLACER_REGEXP = new RegExp(escapeRegExp(COLON_REPLACER), 'g');

const TAB_ALLOWED_CHARACTERS = ['\t'];
const emojiData = Object.fromEntries(
  Object.entries(emojilib.lib).map(([name, { char }]) => [name, char])
);

// HARD_RETURN holds a character sequence used to indicate text has a
// hard (no-reflowing) line break.  Previously \r and \r\n were turned
// into \n in marked's lexer- preprocessing step. So \r is safe to use
// to indicate a hard (non-reflowed) return.
const HARD_RETURN = '\r',
  HARD_RETURN_RE = new RegExp(HARD_RETURN),
  HARD_RETURN_GFM_RE = new RegExp(HARD_RETURN + '|<br />');

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
  text: identity,
  unescape: true,
  emoji: true,
  width: 80,
  showSectionPrefix: true,
  reflowText: false,
  tab: 4,
  tableOptions: {}
};

const defaultHighlightTheme = {
  keyword: colors.blue,
  built_in: colors.cyan,
  type: colors.cyan.dim,
  literal: colors.blue,
  number: colors.green,
  regexp: colors.red,
  string: colors.red,
  subst: identity,
  symbol: identity,
  class: colors.blue,
  function: colors.yellow,
  title: identity,
  params: identity,
  comment: colors.green,
  doctag: colors.green,
  meta: colors.gray,
  'meta-keyword': identity,
  'meta-string': identity,
  section: identity,
  tag: colors.gray,
  name: colors.blue,
  'builtin-name': identity,
  attr: colors.cyan,
  attribute: identity,
  variable: identity,
  bullet: identity,
  code: identity,
  emphasis: colors.italic,
  strong: colors.bold,
  formula: identity,
  link: colors.underline,
  quote: identity,
  'selector-tag': identity,
  'selector-id': identity,
  'selector-class': identity,
  'selector-attr': identity,
  'selector-pseudo': identity,
  'template-tag': identity,
  'template-variable': identity,
  addition: colors.green,
  deletion: colors.red,
  default: identity
};

class TerminalRenderer {
  constructor(options = {}) {
    this.o = { ...defaultOptions, ...options };
    this.tab = sanitizeTab(this.o.tab, defaultOptions.tab);
    this.tableSettings = this.o.tableOptions;
    this.emoji = this.o.emoji ? insertEmojis : identity;
    this.unescape = this.o.unescape ? unescapeEntities : identity;
    this.o.highlightOptions = {
      theme: {
        ...defaultHighlightTheme,
        ...options.highlightOptions?.theme
      },
      ignoreIllegals: options.highlightOptions?.ignoreIllegals
    };

    this.transform = compose(undoColon, this.unescape, this.emoji);
  }

  get textLength() {
    return textLength;
  }

  space() {
    return '';
  }

  text(text) {
    if (typeof text === 'object') {
      text = text.text;
    }
    return this.o.text(text);
  }

  code(code, lang, escaped) {
    if (typeof code === 'object') {
      lang = code.lang;
      escaped = !!code.escaped;
      code = code.text;
    }
    return section(indentify(this.tab, highlight(code, lang, this.o)));
  }

  blockquote(quote) {
    if (typeof quote === 'object') {
      quote = this.parser.parse(quote.tokens);
    }
    return section(this.o.blockquote(indentify(this.tab, quote.trim())));
  }

  html(html) {
    if (typeof html === 'object') {
      html = html.text;
    }
    return this.o.html(html);
  }

  heading(text, level) {
    if (typeof text === 'object') {
      level = text.depth;
      text = this.parser.parseInline(text.tokens);
    }
    text = this.transform(text);

    const prefix = this.o.showSectionPrefix ? '#'.repeat(level) + ' ' : '';
    text = prefix + text;
    if (this.o.reflowText) {
      text = reflowText(text, this.o.width, this.options.gfm);
    }
    return section(
      level === 1 ? this.o.firstHeading(text) : this.o.heading(text)
    );
  }

  hr() {
    return section(this.o.hr(hr('-', this.o.reflowText && this.o.width)));
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
    body = this.o.list(body, ordered, this.tab);
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
            item.tokens[0].text = checkbox + ' ' + item.tokens[0].text;
            if (
              item.tokens[0].tokens &&
              item.tokens[0].tokens.length > 0 &&
              item.tokens[0].tokens[0].type === 'text'
            ) {
              item.tokens[0].tokens[0].text =
                checkbox + ' ' + item.tokens[0].tokens[0].text;
            }
          } else {
            item.tokens.unshift({
              type: 'text',
              raw: checkbox + ' ',
              text: checkbox + ' '
            });
          }
        } else {
          text += checkbox + ' ';
        }
      }

      text += this.parser.parse(item.tokens, !!item.loose);
    }
    const transform = compose(this.o.listitem, this.transform);
    const isNested = text.indexOf('\n') !== -1;
    if (isNested) text = text.trim();

    // Use BULLET_POINT as a marker for ordered or unordered list item
    return '\n' + BULLET_POINT + transform(text);
  }

  checkbox(checked) {
    if (typeof checked === 'object') {
      checked = checked.checked;
    }
    return '[' + (checked ? 'X' : ' ') + '] ';
  }

  paragraph(text) {
    if (typeof text === 'object') {
      text = this.parser.parseInline(text.tokens);
    }
    const transform = compose(this.o.paragraph, this.transform);
    text = transform(text);
    if (this.o.reflowText) {
      text = reflowText(text, this.o.width, this.options.gfm);
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
      head: generateTableRow(header)[0],
      ...this.tableSettings
    });

    generateTableRow(body, this.transform).forEach(function (row) {
      table.push(row);
    });
    return section(this.o.table(table.toString()));
  }

  tablerow(content) {
    if (typeof content === 'object') {
      content = content.text;
    }
    return TABLE_ROW_WRAP + content + TABLE_ROW_WRAP + '\n';
  }

  tablecell(content) {
    if (typeof content === 'object') {
      content = this.parser.parseInline(content.tokens);
    }
    return content + TABLE_CELL_SPLIT;
  }

  // span level renderer
  strong(text) {
    if (typeof text === 'object') {
      text = this.parser.parseInline(text.tokens);
    }
    return this.o.strong(text);
  }

  em(text) {
    if (typeof text === 'object') {
      text = this.parser.parseInline(text.tokens);
    }
    text = fixHardReturn(text, this.o.reflowText);
    return this.o.em(text);
  }

  codespan(text) {
    if (typeof text === 'object') {
      text = text.text;
    }
    text = fixHardReturn(text, this.o.reflowText);
    return this.o.codespan(text.replace(/:/g, COLON_REPLACER));
  }

  br() {
    return this.o.reflowText ? HARD_RETURN : '\n';
  }

  del(text) {
    if (typeof text === 'object') {
      text = this.parser.parseInline(text.tokens);
    }
    return this.o.del(text);
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
      } catch (e) {
        return '';
      }
      if (prot.indexOf('javascript:') === 0) {
        return '';
      }
    }

    const hasText = text && text !== href;

    let out = '';

    if (supportsHyperlinks.stdout) {
      let link = '';
      if (text) {
        link = this.o.href(this.emoji(text));
      } else {
        link = this.o.href(href);
      }
      // textLength breaks on '+' in URLs
      out = `\u001B]8;;${href.replace(/\+/g, '%20')}\u0007${link}\u001B]8;;\u0007`;
    } else {
      if (hasText) out += this.emoji(text) + ' (';
      out += this.o.href(href);
      if (hasText) out += ')';
    }
    return this.o.link(out);
  }

  image(href, title, text) {
    if (typeof href === 'object') {
      title = href.title;
      text = href.text;
      href = href.href;
    }

    if (typeof this.o.image === 'function') {
      return this.o.image(href, title, text);
    }
    let out = '![' + text;
    if (title) out += ' – ' + title;
    return out + '](' + href + ')\n';
  }
}

function fixHardReturn(text, reflow) {
  return reflow ? text.replace(HARD_RETURN, /\n/g) : text;
}

function markedTerminal(options, highlightOptions) {
  const r = new TerminalRenderer(options, highlightOptions);

  const funcs = [
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

  return funcs.reduce(
    (extension, func) => {
      extension.renderer[func] = function (...args) {
        r.options = this.options;
        r.parser = this.parser;
        return r[func](...args);
      };
      return extension;
    },
    { renderer: {}, useNewRenderer: true }
  );
}

export { TerminalRenderer, markedTerminal };

// Munge \n's and spaces in "text" so that the number of
// characters between \n's is less than or equal to "width".
function reflowText(text, width, gfm) {
  // Hard break was inserted by TerminalRenderer.prototype.br or is
  // <br /> when gfm is true
  const splitRe = gfm ? HARD_RETURN_GFM_RE : HARD_RETURN_RE,
    sections = text.split(splitRe),
    reflowed = [];

  sections.forEach(function (section) {
    // Split the section by escape codes so that we can
    // deal with them separately.
    const fragments = section.split(/(\u001b\[(?:\d{1,3})(?:;\d{1,3})*m)/g);
    let column = 0;
    let currentLine = '';
    let lastWasEscapeChar = false;

    while (fragments.length) {
      const fragment = fragments[0];

      if (fragment === '') {
        fragments.splice(0, 1);
        lastWasEscapeChar = false;
        continue;
      }

      // This is an escape code - leave it whole and
      // move to the next fragment.
      if (!textLength(fragment)) {
        currentLine += fragment;
        fragments.splice(0, 1);
        lastWasEscapeChar = true;
        continue;
      }

      const words = fragment.split(/[ \t\n]+/);

      for (let i = 0; i < words.length; i++) {
        let word = words[i];
        let addSpace = column != 0;
        if (lastWasEscapeChar) addSpace = false;

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
            const w = word.substr(0, width - column - addSpace);
            if (addSpace) currentLine += ' ';
            currentLine += w;
            reflowed.push(currentLine);
            currentLine = '';
            column = 0;

            word = word.substr(w.length);
            while (word.length) {
              const w = word.substr(0, width);

              if (!w.length) break;

              if (w.length < width) {
                currentLine = w;
                column = w.length;
                break;
              } else {
                reflowed.push(w);
                word = word.substr(width);
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

        lastWasEscapeChar = false;
      }

      fragments.splice(0, 1);
    }

    if (textLength(currentLine)) reflowed.push(currentLine);
  });

  return reflowed.join('\n');
}

function indentLines(indent, text) {
  return text.replace(/(^|\n)(.+)/g, '$1' + indent + '$2');
}

function indentify(indent, text) {
  if (!text) return text;
  return indent + text.split('\n').join('\n' + indent);
}

const BULLET_POINT_REGEX = '\\*';
const NUMBERED_POINT_REGEX = '\\d+\\.';
const POINT_REGEX =
  '(?:' + [BULLET_POINT_REGEX, NUMBERED_POINT_REGEX].join('|') + ')';

// Prevents nested lists from joining their parent list's last line
function fixNestedLists(body, indent) {
  const regex = new RegExp(
    '' +
      '(\\S(?: |  )?)' + // Last char of current point, plus one or two spaces
      // to allow trailing spaces
      '((?:' +
      indent +
      ')+)' + // Indentation of sub point
      '(' +
      POINT_REGEX +
      '(?:.*)+)$',
    'gm'
  ); // Body of subpoint
  return body.replace(regex, '$1\n' + indent + '$2$3');
}

function isPointedLine(line, indent) {
  return line.match('^(?:' + indent + ')*' + POINT_REGEX);
}

function toSpaces(str) {
  return ' '.repeat(str.length);
}

const BULLET_POINT = '* ';
function bulletPointLine(indent, line) {
  return isPointedLine(line, indent) ? line : toSpaces(BULLET_POINT) + line;
}

function bulletPointLines(lines, indent) {
  const transform = bulletPointLine.bind(null, indent);
  return lines.split('\n').filter(identity).map(transform).join('\n');
}

function numberedPoint(n) {
  return n + '. ';
}

function numberedLine(indent, line, num) {
  return isPointedLine(line, indent)
    ? {
        num: num + 1,
        line: line.replace(BULLET_POINT, numberedPoint(num + 1))
      }
    : {
        num: num,
        line: toSpaces(numberedPoint(num)) + line
      };
}

function numberedLines(lines, indent) {
  const transform = numberedLine.bind(null, indent);
  let num = 0;
  return lines
    .split('\n')
    .filter(identity)
    .map((line) => {
      const numbered = transform(line, num);
      num = numbered.num;

      return numbered.line;
    })
    .join('\n');
}

function list(body, ordered, indent) {
  body = body.trim();
  body = ordered ? numberedLines(body, indent) : bulletPointLines(body, indent);
  return body;
}

function section(text) {
  return text + '\n\n';
}

function colorizeHighlightNode(node, theme, isTop = false) {
  if (typeof node === 'string') {
    return isTop ? (theme.default ?? identity)(node) : node;
  }

  if (node.scope) {
    const colorized = node.children
      .map((n) => colorizeHighlightNode(n))
      .join('');
    return (theme[node.scope] ?? identity)(colorized);
  }

  return node.children.map((n) => colorizeHighlightNode(n, true)).join('');
}

function highlight(code, language, opts) {
  if (!colors.enabled) return code;

  const style = opts.code;

  code = fixHardReturn(code, opts.reflowText);

  try {
    const result = hljs.highlight(code, { ...opts.highlightOptions, language });
    const nodes = result.emitter.rootNode;
    return colorizeHighlightNode(nodes);
  } catch (e) {
    return style(code);
  }
}

function insertEmojis(text) {
  return text.replace(/:([A-Za-z0-9_\-\+]+?):/g, function (emojiString) {
    const emojiSign = emojiData[emojiString.slice(1, -1)];
    if (!emojiSign) return emojiString;
    return emojiSign + ' ';
  });
}

function hr(inputHrStr, length) {
  length = length || process.stdout.columns;
  return inputHrStr.repeat(length - 1);
}

function undoColon(str) {
  return str.replace(COLON_REPLACER_REGEXP, ':');
}

function generateTableRow(text, escape) {
  if (!text) return [];
  escape = escape || identity;
  const lines = escape(text).split('\n');

  const data = [];
  lines.forEach(function (line) {
    if (!line) return;
    const parsed = line
      .replace(TABLE_ROW_WRAP_REGEXP, '')
      .split(TABLE_CELL_SPLIT);

    data.push(parsed.splice(0, parsed.length - 1));
  });
  return data;
}

function escapeRegExp(str) {
  return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, '\\$&');
}

function unescapeEntities(html) {
  return html
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");
}

function identity(str) {
  return str;
}

function compose(...funcs) {
  return function (...args) {
    let i = funcs.length;
    for (; i-- > 0; ) {
      args = [funcs[i](...args)];
    }
    return args[0];
  };
}

function isAllowedTabString(string) {
  return TAB_ALLOWED_CHARACTERS.some(function (char) {
    return string.match('^(' + char + ')+$');
  });
}

function sanitizeTab(tab, fallbackTab) {
  if (typeof tab === 'number') {
    return ' '.repeat(tab);
  } else if (typeof tab === 'string' && isAllowedTabString(tab)) {
    return tab;
  } else {
    return ' '.repeat(fallbackTab);
  }
}

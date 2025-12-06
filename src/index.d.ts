import { type TableConstructorOptions } from 'cli-table3';
import { type MarkedExtension, type RendererApi } from 'marked';

type Formatter = (arg: string) => string;

export interface RendererOptions {
  /** Formatter for code block. */
  code?: Formatter;
  /** Formatter for blockquote. */
  blockquote?: Formatter;
  /** Formatter for html. */
  html?: Formatter;
  /** Formatter for heading. */
  heading?: Formatter;
  /** Formatter for top-level heading. */
  firstHeading?: Formatter;
  /** Formatter for hr. */
  hr?: Formatter;
  /** Formatter for list item. */
  listitem?: Formatter;
  /** Formatter for table. */
  table?: Formatter;
  /** Formatter for paragraph. */
  paragraph?: Formatter;
  /** Formatter for strong (bold) text. */
  strong?: Formatter;
  /** Formatter for emphasis (italic) text. */
  em?: Formatter;
  /** Formatter for inline code. */
  codespan?: Formatter;
  /** Formatter for deletion. */
  del?: Formatter;
  /** Formatter for link. */
  link?: Formatter;
  /** Formatter for href in link. */
  href?: Formatter;
  /** Formatter for text. */
  text?: Formatter;
  /** Formats the bulletpoints and numbers for lists. */
  list?: (body: string, ordered: boolean, indent: string) => string;
  /** Function for overriding the default image handling. */
  image?: (href: string, title: string, text: string) => string;
  /** Reflow. */
  reflowText?: boolean;
  /** Only applicable when {@link reflowText} is true. */
  width?: number;
  /** Whether or not to undo marked escaping of enitities. */
  unescape?: boolean;
  /** Whether or not to show emojis. */
  emoji?: boolean;
  /** Should it prefix headers? */
  showSectionPrefix?: boolean;
  /** The size of tabs in number of spaces or as tab characters. */
  tab?: string | number;
  /** Options passed to `cli-table3`. */
  tableOptions?: Omit<TableConstructorOptions, 'head'>;
  /** Highlight Options */
  highlightOptions?: HighlightOptions;
}

interface HighlightThemeOptions {
  /**
   * keyword in a regular Algol-style language
   */
  keyword?: Formatter;
  /**
   * built-in or library object (constant, class, function)
   */
  built_in?: Formatter;
  /**
   * user-defined type in a language with first-class syntactically significant types, like Haskell
   */
  type?: Formatter;
  /**
   * special identifier for a built-in value ("true", "false", "null")
   */
  literal?: Formatter;
  /**
   * number, including units and modifiers, if any.
   */
  number?: Formatter;
  /**
   * literal regular expression
   */
  regexp?: Formatter;
  /**
   * literal string, character
   */
  string?: Formatter;
  /**
   * parsed section inside a literal string
   */
  subst?: Formatter;
  /**
   * symbolic constant, interned string, goto label
   */
  symbol?: Formatter;
  /**
   * class or class-level declaration (interfaces, traits, modules, etc)
   */
  class?: Formatter;
  /**
   * function or method declaration
   */
  function?: Formatter;
  /**
   * name of a class or a function at the place of declaration
   */
  title?: Formatter;
  /**
   * block of function arguments (parameters) at the place of declaration
   */
  params?: Formatter;
  /**
   * comment
   */
  comment?: Formatter;
  /**
   * documentation markup within comments
   */
  doctag?: Formatter;
  /**
   * flags, modifiers, annotations, processing instructions, preprocessor directive, etc
   */
  meta?: Formatter;
  /**
   * keyword or built-in within meta construct
   */
  'meta-keyword'?: Formatter;
  /**
   * string within meta construct
   */
  'meta-string'?: Formatter;
  /**
   * heading of a section in a config file, heading in text markup
   */
  section?: Formatter;
  /**
   * XML/HTML tag
   */
  tag?: Formatter;
  /**
   * name of an XML tag, the first word in an s-expression
   */
  name?: Formatter;
  /**
   * s-expression name from the language standard library
   */
  'builtin-name'?: Formatter;
  /**
   * name of an attribute with no language defined semantics (keys in JSON, setting names in .ini), also sub-attribute within another highlighted object, like XML tag
   */
  attr?: Formatter;
  /**
   * name of an attribute followed by a structured value part, like CSS properties
   */
  attribute?: Formatter;
  /**
   * variable in a config or a template file, environment var expansion in a script
   */
  variable?: Formatter;
  /**
   * list item bullet in text markup
   */
  bullet?: Formatter;
  /**
   * code block in text markup
   */
  code?: Formatter;
  /**
   * emphasis in text markup
   */
  emphasis?: Formatter;
  /**
   * strong emphasis in text markup
   */
  strong?: Formatter;
  /**
   * mathematical formula in text markup
   */
  formula?: Formatter;
  /**
   * hyperlink in text markup
   */
  link?: Formatter;
  /**
   * quotation in text markup
   */
  quote?: Formatter;
  /**
   * tag selector in CSS
   */
  'selector-tag'?: Formatter;
  /**
   * #id selector in CSS
   */
  'selector-id'?: Formatter;
  /**
   * .class selector in CSS
   */
  'selector-class'?: Formatter;
  /**
   * [attr] selector in CSS
   */
  'selector-attr'?: Formatter;
  /**
   * :pseudo selector in CSS
   */
  'selector-pseudo'?: Formatter;
  /**
   * tag of a template language
   */
  'template-tag'?: Formatter;
  /**
   * variable in a template language
   */
  'template-variable'?: Formatter;
  /**
   * added or changed line in a diff
   */
  addition?: Formatter;
  /**
   * deleted line in a diff
   */
  deletion?: Formatter;
  /**
   * default, used in top scope
   */
  default?: Formatter;
}

interface HighlightOptions {
  /** Highlight theme options. */
  theme?: HighlightThemeOptions;
  /** `ignoreIllegals` option on `highlight.js`. */
  ignoreIllegals?: boolean;
}

/**
 * Custom Renderer for [marked](https://github.com/markedjs/marked)
 * allowing for printing Markdown to the Terminal. Supports pretty tables, syntax
 * highlighting for javascript, and overriding all colors and styles.
 */
declare class TerminalRenderer implements RendererApi {
  constructor(options?: RendererOptions);
}

/**
 * Marked extension with {@link TerminalRenderer} Renderer.
 * @param {RendererOptions} options Renderer Options.
 * @returns {MarkedExtension} Marked extension.
 */
declare function markedTerminal(options?: RendererOptions): MarkedExtension;

export { TerminalRenderer, markedTerminal };

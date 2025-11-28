import { type TableConstructorOptions } from 'cli-table3';
import { type MarkedExtension, type RendererApi } from 'marked';

type Formatter = (arg: string) => string;

export interface RendererOptions {
  code?: Formatter;
  blockquote?: Formatter;
  html?: Formatter;
  heading?: Formatter;
  firstHeading?: Formatter;
  hr?: Formatter;
  listitem?: Formatter;
  list?: (
    body: string,
    ordered: boolean,
    indent: RendererOptions['tab']
  ) => string;
  table?: Formatter;
  paragraph?: Formatter;
  strong?: Formatter;
  em?: Formatter;
  codespan?: Formatter;
  del?: Formatter;
  link?: Formatter;
  href?: Formatter;
  text?: Formatter;
  unescape?: boolean;
  emoji?: boolean;
  width?: number;
  showSectionPrefix?: boolean;
  reflowText?: boolean;
  tab?: string | number;
  tableOptions?: TableConstructorOptions;
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

export interface HighlightOptions {
  theme?: HighlightThemeOptions;
  ignoreIllegals?: boolean;
}

declare class TerminalRenderer implements RendererApi {
  constructor(options?: RendererOptions, highlightOptions?: HighlightOptions);
}

declare function markedTerminal(
  options?: RendererOptions,
  highlightOptions?: HighlightOptions
): MarkedExtension;

export { TerminalRenderer, markedTerminal };

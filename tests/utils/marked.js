import * as m from 'marked';
import * as mt from '../../src/index.js';

export const marked = 'marked' in m ? m.marked : m.default;

export const resetMarked = () => {
  marked.setOptions(marked.getDefaults());

  if ('use' in marked) {
    // Test wrapper to handle v5 with breaking changes
    marked.use({
      mangle: false,
      headerIds: false
    });
  }
};

resetMarked();

export const install = (legacy, options = {}) => {
  if (legacy) {
    marked.setOptions({
      renderer: new mt.TerminalRenderer(options)
    });
  } else {
    marked.use(mt.markedTerminal(options));
  }
};

export const defaultOptions = {
  code: String,
  blockquote: String,
  html: String,
  heading: String,
  firstHeading: String,
  hr: String,
  listitem: String,
  table: String,
  paragraph: String,
  strong: String,
  em: String,
  codespan: String,
  del: String,
  link: String,
  href: String
};

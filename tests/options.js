import { beforeEach, describe, it } from 'node:test';
import { notEqual, equal } from 'node:assert/strict';
import {
  marked,
  resetMarked,
  install,
  defaultOptions
} from './utils/marked.js';

const options = {
  ...defaultOptions,
  emoji: false
};

[true, false].forEach((legacy) => {
  describe(`Options (${legacy ? 'TerminalRenderer' : 'markedTerminal'})`, () => {
    beforeEach(() => {
      resetMarked();
    });

    it('should not translate emojis', () => {
      install(legacy, options);
      const markdownText = 'Some :emoji:';

      notEqual(marked(markdownText).indexOf(':emoji:'), -1);
    });

    it('should change tabs by space size', () => {
      install(legacy, { ...options, tab: 4 });

      const blockquoteText = '> Blockquote';
      equal(marked(blockquoteText), '    Blockquote\n\n');

      const listText = '* List Item';
      equal(marked(listText), '    * List Item\n\n');
    });

    it('should use default tabs if passing not supported string', () => {
      install(legacy, { ...options, tab: 'dsakdskajhdsa' });

      const blockquoteText = '> Blockquote';
      equal(marked(blockquoteText), '    Blockquote\n\n');

      const listText = '* List Item';
      equal(marked(listText), '    * List Item\n\n');
    });

    it('should change tabs by allowed characters', () => {
      install(legacy, { ...options, tab: '\t' });

      const blockquoteText = '> Blockquote';
      equal(marked(blockquoteText), '\tBlockquote\n\n');

      const listText = '* List Item';
      equal(marked(listText), '\t* List Item\n\n');
    });

    it('should support mulitple tab characters', () => {
      install(legacy, { ...options, tab: '\t\t' });

      const blockquoteText = '> Blockquote';
      equal(marked(blockquoteText), '\t\tBlockquote\n\n');

      const listText = '* List Item';
      equal(marked(listText), '\t\t* List Item\n\n');
    });

    it('should support overriding image handling', () => {
      install(legacy, { ...options, image: () => 'IMAGE' });

      const text = `
# Title
![Alt text](./img.jpg)`;
      equal(
        marked(text),
        `# Title

IMAGE

`
      );
    });
  });
});

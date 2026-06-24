import { beforeEach, describe, it } from 'node:test';
import { equal, notEqual } from 'node:assert/strict';
import { stripVTControlCharacters } from 'node:util';
import {
  marked,
  resetMarked,
  install,
  defaultOptions as options
} from './utils/marked.js';

[true, false].forEach((legacy) => {
  describe(`Usage (${legacy ? 'TerminalRenderer' : 'markedTerminal'})`, () => {
    const markup = (string, gfm = false) =>
      stripVTControlCharacters(marked(string, { gfm }));

    const defaultOptions = {
      ...options,
      tableOptions: {
        chars: { top: '@@@@TABLE@@@@@' }
      }
    };

    const defaultOptions2 = {
      ...options,
      reflowText: true,
      showSectionPrefix: false,
      width: 10
    };

    beforeEach(() => {
      resetMarked();
    });

    it('should render links', () => {
      install(legacy, defaultOptions);
      let text = '[Google](http://google.com)';
      let expected = 'Google (http://google.com)';
      equal(markup(text).trim(), expected);
    });

    it('should pass on options to table', () => {
      install(legacy, defaultOptions);
      let text =
        '| Lorem | Ipsum | Sit amet     | Dolar  |\n' +
        '|------|------|----------|----------|\n' +
        '| Row 1  | Value    | Value  | Value |\n' +
        '| Row 2  | Value    | Value  | Value |\n' +
        '| Row 3  | Value    | Value  | Value |\n' +
        '| Row 4  | Value    | Value  | Value |';

      notEqual(markup(text, true).indexOf('@@@@TABLE@@@@@'), -1);
    });

    it('should not show link href twice if link and url is equal', () => {
      install(legacy, defaultOptions);
      let text = 'http://google.com';
      equal(markup(text).trim(), text);
    });

    it('should render html as html', () => {
      install(legacy, defaultOptions);
      let html = '<strong>foo</strong>';
      equal(markup(html).trim(), html);
    });

    it('should not escape entities', () => {
      install(legacy, defaultOptions);
      let text =
        '# This < is "foo". it\'s a & string\n' +
        '> This < is "foo". it\'s a & string\n\n' +
        'This < is **"foo"**. it\'s a & string\n' +
        'This < is "foo". it\'s a & string';

      let expected =
        '# This < is "foo". it\'s a & string\n\n' +
        '    This < is "foo". it\'s a & string\n\n' +
        'This < is "foo". it\'s a & string\n' +
        'This < is "foo". it\'s a & string';
      equal(markup(text).trim(), expected);
    });

    it('should not translate emojis inside codespans', () => {
      install(legacy, defaultOptions);
      let markdownText = 'Some `:+1:`';

      notEqual(markup(markdownText).indexOf(':+1:'), -1);
    });

    it('should translate emojis', () => {
      install(legacy, defaultOptions);
      let markdownText = 'Some :+1:';
      equal(markup(markdownText).indexOf(':+1'), -1);
    });

    it('should show default if not supported emojis', () => {
      install(legacy, defaultOptions);
      let markdownText = 'Some :someundefined:';
      notEqual(markup(markdownText).indexOf(':someundefined:'), -1);
    });

    it('should not escape entities', () => {
      install(legacy, defaultOptions);
      let markdownText =
        'Usage | Syntax' +
        '\r\n' +
        '------|-------' +
        '\r\n' +
        'General |`$ shell <CommandParam>`';

      notEqual(markup(markdownText).indexOf('<CommandParam>'), -1);
    });

    it('should reflow paragraph and split words that are too long (one break)', () => {
      install(legacy, defaultOptions2);
      let text = 'Now is the time: 01234567890\n';
      let expected = 'Now is the\ntime: 0123\n4567890\n\n';
      equal(markup(text), expected);
    });

    it('should reflow paragraph and split words that are too long (two breaks)', () => {
      install(legacy, defaultOptions2);
      let text = 'Now is the time: http://timeanddate.com\n';
      let expected = 'Now is the\ntime: http\n://timeand\ndate.com\n\n';
      equal(markup(text), expected);
    });

    it('should reflow paragraph', () => {
      install(legacy, defaultOptions2);
      let text = 'Now is the time\n';
      let expected = 'Now is the\ntime\n\n';
      equal(markup(text), expected);
    });

    it('should nuke section header', () => {
      install(legacy, defaultOptions2);
      let text = '# Contents\n';
      let expected = 'Contents\n\n';
      equal(markup(text), expected);
    });

    it('should reflow and nuke section header', () => {
      install(legacy, defaultOptions2);
      let text = '# Now is the time\n';
      let expected = 'Now is the\ntime\n\n';
      equal(markup(text), expected);
    });

    // TODO There's an issue when running at GH Actions that cannot
    // be reproduced right now.
    it.skip('should preserve line breaks (non gfm)', () => {
      let text = 'Now  \nis    \nthe<br/>time\n';
      let expected = 'Now\nis\nthe<br/>\ntime\n\n';
      equal(markup(text, false), expected);
    });

    it('should preserve line breaks (gfm)', () => {
      install(legacy, defaultOptions2);
      let text = 'Now  \nis    \nthe<br />time\n';
      let expected = 'Now\nis\nthe\ntime\n\n';
      equal(markup(text, true), expected);
    });

    it('should render ordered and unordered list with same newlines', () => {
      install(legacy, defaultOptions2);
      let ul = '* ul item\n' + '* ul item';
      let ol = '1. ol item\n' + '2. ol item';
      let before = '';
      let after = '\n\n';

      equal(markup(ul), before + '    * ul item\n' + '    * ul item' + after);

      equal(markup(ol), before + '    1. ol item\n' + '    2. ol item' + after);
    });

    it('should render nested lists', () => {
      install(legacy, defaultOptions2);
      let ul = '* ul item\n' + '    * ul item';
      let ol = '1. ol item\n' + '    1. ol item';
      let olul = '1. ol item\n' + '    * ul item';
      let ulol = '* ul item\n' + '    1. ol item';
      let before = '';
      let after = '\n\n';

      equal(
        markup(ul),
        before + '    * ul item\n' + '        * ul item' + after
      );

      equal(
        markup(ol),
        before + '    1. ol item\n' + '        1. ol item' + after
      );

      equal(
        markup(olul),
        before + '    1. ol item\n' + '        * ul item' + after
      );

      equal(
        markup(ulol),
        before + '    * ul item\n' + '        1. ol item' + after
      );
    });

    it('should render task items', () => {
      install(legacy, defaultOptions2);
      let tasks = '* [ ] task item\n' + '* [X] task item';
      let before = '';
      let after = '\n\n';

      equal(
        markup(tasks),
        before + '    * [ ] task item\n' + '    * [X] task item' + after
      );
    });
  });
});

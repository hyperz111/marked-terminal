import { beforeEach, describe, it } from 'node:test';
import { stripVTControlCharacters } from 'node:util';
import { equal } from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import {
  marked,
  resetMarked,
  install,
  defaultOptions
} from './utils/marked.js';

const getFixtureFile = (fileName) =>
  readFileSync(resolve(import.meta.dirname, 'fixtures', fileName), 'utf8');

[true, false].forEach((legacy) => {
  describe(`e2e (${legacy ? 'TerminalRenderer' : 'markedTerminal'})`, () => {
    function markup(string) {
      return stripVTControlCharacters(marked(string));
    }

    beforeEach(() => {
      resetMarked();
    });

    it('should render a document full of different supported syntax', () => {
      install(legacy, defaultOptions);
      const actual = markup(getFixtureFile('e2e.md'));
      const expected = getFixtureFile('e2e.result.txt');
      equal(actual, expected);
    });
  });
});

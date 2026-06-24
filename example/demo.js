import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { TerminalRenderer } from '../src/index.js';
import { marked } from '../tests/utils/marked.js';

// Example showing usage information from a CLI tool.

marked.setOptions({
  // Define custom renderer
  renderer: new TerminalRenderer()
});

// Show the parsed data
console.log(
  marked(readFileSync(resolve(import.meta.dirname, 'usage.md'), 'utf8'))
);

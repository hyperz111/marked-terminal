import colors from '@colors/colors/safe.js';
import { TerminalRenderer } from '../src/index.js';
import { marked } from '../tests/utils/marked.js';

marked.setOptions({
  // Define custom renderer
  renderer: new TerminalRenderer({
    // Change style for code
    codespan: colors.underline.magenta,
    emoji: true,

    // Can also override color/styling by own functions.
    firstHeading: (text) => `*** ${text}`
  })
});

const text = `
# Hello 
This is **markdown** printed in the \`terminal\` :+1:
`;

// Show the parsed data
console.log(marked(text.trim()));

import { marked } from '../tests/utils/marked.js';
import colors from '@colors/colors/safe.js';
import { TerminalRenderer } from '../src/index.js';

marked.setOptions({
  // Define custom renderer
  renderer: new TerminalRenderer({
    // Change style for code
    codespan: colors.underline.magenta,
    emoji: true,

    // Can also override color/styling by own functions.
    firstHeading: function (text) {
      return '*** ' + text;
    }
  })
});

// Show the parsed data
console.log(
  marked('# Hello \n\nThis is **markdown** printed in the `terminal` :+1:')
);

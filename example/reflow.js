import { TerminalRenderer } from '../src/index.js';
import { marked } from '../tests/utils/marked.js';

marked.setOptions({
  // Define custom renderer
  renderer: new TerminalRenderer({
    reflowText: true,
    width: 60
  })
});

let text = `
# Hello with a very long title which should be reflowed atleast once 

---

This is **markdown** printed in the \`terminal\` and with a very long sentence. Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum.
`;

// Show the parsed data
console.log(marked(text.trim()));

console.log('----------------------');

text = `
**backtrace**([*count*])

Print a stack trace, with the most recent frame at the top. With a positive number, print\n\
at most many entries.

An arrow indicates the 'current frame'. The current frame determines the context used for\n\
many debugger commands such as expression evaluation or source-line listing.\n\

Examples:
---------
    backtrace    // Print a full stack trace
    backtrace 2  // Print only the top two entries

See also:
---------

\`info('frame')\`
`;

console.log(marked(text).trim());

console.log('----------------------');

text = `
Type **help**('*command-name*') to get help for 
command *command-name*.  
Type **help('*')** for the list of all commands.  
Type **help('syntax')** for help on command syntax.  

Note above the use of parenthesis after \"help\" and the quotes when specifying
a parameter.
`;

console.log(marked(text).trim());

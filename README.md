# marked-terminal

> Custom Renderer for [marked](https://github.com/markedjs/marked)
> allowing for printing Markdown to the Terminal. Supports pretty tables, syntax
> highlighting for javascript, and overriding all colors and styles.

Could for instance be used to print usage information.

[![build](https://github.com/mikaelbr/marked-terminal/actions/workflows/ci.yml/badge.svg)](https://github.com/mikaelbr/marked-terminal/actions/workflows/ci.yml) [![npm marked-terminal](https://img.shields.io/npm/v/marked-terminal.svg)](https://www.npmjs.com/package/marked-terminal)

## Install

```sh
npm install marked marked-terminal
```

## Example

```javascript
import { marked } from 'marked';
import { markedTerminal } from 'marked-terminal';

marked.use(markedTerminal([options][, highlightOptions]));

marked.parse('# Hello \n This is **markdown** printed in the `terminal`');
```

### Using older versions

```javascript
const marked = require('marked');
const { TerminalRenderer } = require('marked-terminal');

marked.setOptions({
  // Define custom renderer
  renderer: new TerminalRenderer()
});

// Show the parsed data
console.log(
  marked('# Hello \n This is **markdown** printed in the `terminal`')
);
```

This will produce the following:

![Screenshot of marked-terminal](./screenshot.png)

### Syntax Highlighting

Also have support for syntax highlighting.

Having the following markdown input:

<pre>
```js
var foo = function(bar) {
  console.log(bar);
};
foo('Hello');
```
</pre>

...we will convert it into terminal format:

```javascript
// Show the parsed data
console.log(marked(exampleSource));
```

This will produce the following:

![Screenshot of marked-terminal](./screenshot2.png)

## API

Constructur: `new TerminalRenderer([options])`

### `options`

Used to override default styling (Optional).

Example:

```javascript
marked.setOptions({
  renderer: new TerminalRenderer({
    codespan: chalk.underline.magenta
  })
});
```

See [more examples](./example/)

## Related

- [ink-markdown](https://github.com/cameronhunter/ink-markdown) - Markdown component for Ink

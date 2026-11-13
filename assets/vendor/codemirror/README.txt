CodeMirror 6, bundled into one ES module (codemirror.min.js) with esbuild.
MIT licensed, see LICENSE. Rebuild: npm i the packages below in a scratch dir, then
  npx esbuild entry.js --bundle --format=esm --minify --legal-comments=none --outfile=codemirror.min.js

@codemirror/view 6.43.15
@codemirror/state 6.7.6
@codemirror/commands 6.11.1
@codemirror/language 6.13.1
@codemirror/autocomplete 6.20.4
@codemirror/lang-javascript 6.2.5
@codemirror/lang-python 6.2.1
@lezer/highlight 1.2.5

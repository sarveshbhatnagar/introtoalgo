// Tiny build-time syntax highlighter for JavaScript, Python, JSON and shell.
// Output: escaped HTML with <span class="tk-…"> tokens. Unknown languages are
// escaped only. Good enough for teaching snippets; not a full parser.
import { esc } from './util.mjs';

const JS_KW = new Set('break case catch class const continue debugger default delete do else export extends finally for function if import in instanceof let new of return static super switch throw try typeof var void while with yield async await get set'.split(' '));
const JS_LIT = new Set('true false null undefined NaN Infinity this'.split(' '));
const JS_BUILTIN = new Set('Math Array Object String Number Boolean Map Set JSON console Promise Symbol BigInt Date Error RegExp parseInt parseFloat ListNode TreeNode'.split(' '));
const PY_KW = new Set('and as assert async await break class continue def del elif else except finally for from global if import in is lambda nonlocal not or pass raise return try while with yield match case'.split(' '));
const PY_LIT = new Set('True False None self cls'.split(' '));
const PY_BUILTIN = new Set('print len range enumerate zip map filter sorted reversed sum min max abs int float str list dict set tuple bool any all isinstance super open iter next ord chr divmod pow round heapq collections deque defaultdict Counter math bisect functools lru_cache ListNode TreeNode Optional List'.split(' '));

function span(cls, text) { return `<span class="tk-${cls}">${esc(text)}</span>`; }

function tokenizeGeneric(code, rules) {
  let out = '', i = 0;
  outer: while (i < code.length) {
    for (const [re, fn] of rules) {
      re.lastIndex = i;
      const m = re.exec(code);
      if (m && m.index === i && m[0].length) {
        out += fn(m, code, i + m[0].length);
        i += m[0].length;
        continue outer;
      }
    }
    out += esc(code[i]);
    i++;
  }
  return out;
}

function word(kw, lit, builtin) {
  return (m, code, end) => {
    const w = m[0];
    if (kw.has(w)) return span('k', w);
    if (lit.has(w)) return span('l', w);
    if (builtin.has(w)) return span('b', w);
    if (/^\s*\(/.test(code.slice(end, end + 40))) return span('f', w);
    if (/^[A-Z]/.test(w)) return span('t', w);
    return esc(w);
  };
}

const jsRules = [
  [/\/\/[^\n]*/y, (m) => span('c', m[0])],
  [/\/\*[\s\S]*?\*\//y, (m) => span('c', m[0])],
  [/`(?:\\[\s\S]|[^\\`])*`/y, (m) => span('s', m[0])],
  [/"(?:\\.|[^\\"\n])*"|'(?:\\.|[^\\'\n])*'/y, (m) => span('s', m[0])],
  [/\b(?:0[xX][0-9a-fA-F_]+|0[bB][01_]+|\d[\d_]*(?:\.\d+)?(?:[eE][+-]?\d+)?n?)\b/y, (m) => span('n', m[0])],
  [/[A-Za-z_$][\w$]*/y, word(JS_KW, JS_LIT, JS_BUILTIN)],
  [/=>|===|!==|==|!=|<=|>=|&&|\|\||\?\?|\+\+|--|[-+*/%=<>!&|^~?:]/y, (m) => span('o', m[0])],
];

const pyRules = [
  [/#[^\n]*/y, (m) => span('c', m[0])],
  [/[rRbBfF]{0,2}("""[\s\S]*?"""|'''[\s\S]*?''')/y, (m) => span('s', m[0])],
  [/[rRbBfF]{0,2}("(?:\\.|[^\\"\n])*"|'(?:\\.|[^\\'\n])*')/y, (m) => span('s', m[0])],
  [/@[A-Za-z_][\w.]*/y, (m) => span('b', m[0])],
  [/\b(?:0[xX][0-9a-fA-F_]+|0[bB][01_]+|\d[\d_]*(?:\.\d+)?(?:[eE][+-]?\d+)?j?)\b/y, (m) => span('n', m[0])],
  [/[A-Za-z_][\w]*/y, word(PY_KW, PY_LIT, PY_BUILTIN)],
  [/\*\*|\/\/|==|!=|<=|>=|->|:=|[-+*/%=<>&|^~]/y, (m) => span('o', m[0])],
];

const jsonRules = [
  [/"(?:\\.|[^\\"\n])*"(?=\s*:)/y, (m) => span('p', m[0])],
  [/"(?:\\.|[^\\"\n])*"/y, (m) => span('s', m[0])],
  [/-?\d+(?:\.\d+)?(?:[eE][+-]?\d+)?/y, (m) => span('n', m[0])],
  [/\b(?:true|false|null)\b/y, (m) => span('l', m[0])],
];

const shRules = [
  [/#[^\n]*/y, (m) => span('c', m[0])],
  [/"(?:\\.|[^\\"])*"|'[^']*'/y, (m) => span('s', m[0])],
  [/^\s*[$>]/my, (m) => span('o', m[0])],
  [/(?<=^|\n|\|\s*|&&\s*)[A-Za-z0-9_./-]+/y, (m) => span('f', m[0])],
];

export const LANG_LABEL = { js: 'JavaScript', py: 'Python', json: 'JSON', bash: 'Shell', text: 'Text', sql: 'SQL', prompt: 'Prompt' };

export function highlight(code, lang) {
  switch (lang) {
    case 'js': return tokenizeGeneric(code, jsRules);
    case 'py': return tokenizeGeneric(code, pyRules);
    case 'json': return tokenizeGeneric(code, jsonRules);
    case 'bash': return tokenizeGeneric(code, shRules);
    default: return esc(code);
  }
}

// Highlight and split into lines, each wrapped so CSS can number/highlight it.
// Spans never cross lines because we re-open them per line.
export function highlightLines(code, lang) {
  const html = highlight(code, lang);
  const lines = [];
  let open = null, cur = '';
  const re = /(<span class="tk-[a-z]+">)|(<\/span>)|(\n)|([^<\n]+|<)/g;
  let m;
  while ((m = re.exec(html))) {
    if (m[1]) { open = m[1]; cur += m[1]; }
    else if (m[2]) { open = null; cur += m[2]; }
    else if (m[3]) { if (open) cur += '</span>'; lines.push(cur); cur = open || ''; }
    else cur += m[4];
  }
  lines.push(cur);
  return lines;
}

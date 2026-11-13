// Lesson body components: parse, validate and render.
// One code path for tools/check.mjs and tools/build.mjs, so what the
// validator accepts is exactly what the build can render.
import { esc, stripTags, slugify, parseAttrs, dedent } from './util.mjs';
import { highlightLines, LANG_LABEL } from './highlight.mjs';

export const CODE_LANGS = ['js', 'py', 'text', 'json', 'bash', 'sql', 'prompt'];
export const CALLOUT_TYPES = {
  key: 'Key idea',
  mistake: 'Common mistake',
  tip: 'Tip',
  'real-world': 'In the real world',
};
// Order matters: inner components first (an <x-tryit> answer may hold code, prompts and callouts).
const COMPONENT_NAMES = ['x-code', 'x-tracer', 'x-quiz', 'x-complexity', 'x-figure', 'x-prompt', 'x-callout', 'x-tryit'];
const CHILD_NAMES = ['x-task', 'x-start', 'x-answer', 'x-user', 'x-model', 'x-system'];

/* ---------------------------------------------------------------------- */
/* icons (inline SVG, 24x24 grid, stroke = currentColor)                   */
/* ---------------------------------------------------------------------- */
export const ICONS = {
  key: '<path d="M12 3a6 6 0 0 0-3.6 10.8V17h7.2v-3.2A6 6 0 0 0 12 3Z"/><path d="M9.5 20.5h5"/>',
  mistake: '<path d="M12 3 2.5 20h19L12 3Z"/><path d="M12 10v4.5"/><path d="M12 17.5v.01"/>',
  tip: '<path d="M4 12h3l2-6 4 12 2-6h5"/>',
  'real-world': '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c2.8 3 2.8 15 0 18M12 3c-2.8 3-2.8 15 0 18"/>',
  copy: '<rect x="8" y="8" width="12" height="12" rx="2"/><path d="M16 8V5a1 1 0 0 0-1-1H5a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h3"/>',
  prev: '<path d="m15 6-6 6 6 6"/>',
  next: '<path d="m9 6 6 6-6 6"/>',
  play: '<path d="M7 5v14l12-7L7 5Z"/>',
  pause: '<path d="M8 5v14M16 5v14"/>',
  restart: '<path d="M4 12a8 8 0 1 0 2.3-5.6"/><path d="M4 4v4h4"/>',
  check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
  x: '<path d="M6 6l12 12M18 6 6 18"/>',
  sparkle: '<path d="M12 3v4M12 17v4M3 12h4M17 12h4M6 6l2.5 2.5M15.5 15.5 18 18M18 6l-2.5 2.5M8.5 15.5 6 18"/>',
  pencil: '<path d="M4 20h4L19 9l-4-4L4 16v4Z"/><path d="m13.5 6.5 4 4"/>',
  clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>',
  book: '<path d="M4 5a2 2 0 0 1 2-2h13v16H6a2 2 0 0 0-2 2V5Z"/><path d="M4 19a2 2 0 0 1 2-2h13"/>',
  code: '<path d="m8 8-4 4 4 4M16 8l4 4-4 4M14 4l-4 16"/>',
  bolt: '<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/>',
  arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
  lock: '<rect x="5" y="11" width="14" height="9" rx="2"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
  sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4"/>',
  moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5Z"/>',
  search: '<circle cx="11" cy="11" r="7"/><path d="m20 20-4-4"/>',
  list: '<path d="M9 6h11M9 12h11M9 18h11M4 6h.01M4 12h.01M4 18h.01"/>',
  chat: '<path d="M4 5h16v11H9l-5 4V5Z"/>',
  flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5"/>',
  target: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1"/>',
  graph: '<circle cx="6" cy="6" r="2.5"/><circle cx="18" cy="8" r="2.5"/><circle cx="9" cy="18" r="2.5"/><path d="M8.3 7 15.6 7.8M7 8.4l1.5 7.2M16.6 10l-5.8 6.4"/>',
  brain: '<path d="M9 4a3 3 0 0 0-3 3 3 3 0 0 0-2 5 3 3 0 0 0 2 5 3 3 0 0 0 6 1V5a3 3 0 0 0-3-1Z"/><path d="M15 4a3 3 0 0 1 3 3 3 3 0 0 1 2 5 3 3 0 0 1-2 5 3 3 0 0 1-6 1"/>',
  terminal: '<rect x="3" y="4" width="18" height="16" rx="2"/><path d="m7 9 3 3-3 3M12 15h5"/>',
  menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
  hint: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-4 10.5c.8.8 1 1.5 1 2.5h6c0-1 .2-1.7 1-2.5A6 6 0 0 0 12 3Z"/>',
  reset: '<path d="M4 12a8 8 0 1 0 2.3-5.6"/><path d="M4 4v4h4"/>',
};

export function icon(name, cls = 'icon') {
  return `<svg class="${cls}" viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${ICONS[name] || ''}</svg>`;
}

/* ---------------------------------------------------------------------- */
/* reporting                                                               */
/* ---------------------------------------------------------------------- */
function makeReporter(src, lineOffset, errors, warnings) {
  const lineAt = (offset) => (offset == null ? null : src.slice(0, offset).split('\n').length + lineOffset - 1);
  return {
    error: (msg, offset) => errors.push({ line: lineAt(offset), msg }),
    warn: (msg, offset) => warnings.push({ line: lineAt(offset), msg }),
  };
}

function parseJsonBlock(inner, name, rep, offset) {
  const m = inner.match(/^\s*<script\s+type\s*=\s*"application\/json"\s*>([\s\S]*?)<\/script>\s*$/i);
  if (!m) {
    rep.error(`<${name}> must contain exactly one <script type="application/json"> … </script> block and nothing else.`, offset);
    return null;
  }
  try {
    return JSON.parse(m[1]);
  } catch (e) {
    rep.error(`<${name}> JSON does not parse: ${e.message}`, offset);
    return null;
  }
}

function onlyKeys(obj, allowed, where, rep, offset) {
  if (!obj || typeof obj !== 'object' || Array.isArray(obj)) { rep.error(`${where} must be an object.`, offset); return false; }
  let ok = true;
  for (const k of Object.keys(obj)) {
    if (!allowed.includes(k)) { rep.error(`${where}: unknown key "${k}". Allowed: ${allowed.join(', ')}.`, offset); ok = false; }
  }
  return ok;
}

const isInt = (n) => Number.isInteger(n);

/* ---------------------------------------------------------------------- */
/* x-code                                                                  */
/* ---------------------------------------------------------------------- */
function renderCodePane(code, lang) {
  const lines = highlightLines(code, lang);
  return `<div class="code__pane" data-lang="${lang}"><pre class="code__pre" tabindex="0"><code class="lang-${lang}">${lines.map((l) => `<span class="ln">${l || ' '}</span>`).join('\n')}</code></pre></div>`;
}

let codeCounter = 0;
export function renderCode(panes, { title = '', single = false } = {}) {
  const id = `code-${++codeCounter}`;
  const head = single
    ? `<div class="code__bar"><span class="code__lang">${esc(title || LANG_LABEL[panes[0].lang] || panes[0].lang)}</span>`
    : `<div class="code__bar">${title ? `<span class="code__title">${esc(title)}</span>` : ''}<div class="code__tabs" role="tablist" aria-label="Language">${panes
        .map((p) => `<button type="button" role="tab" class="code__tab" data-set-lang="${p.lang}" aria-controls="${id}-${p.lang}">${LANG_LABEL[p.lang]}</button>`)
        .join('')}</div>`;
  const copy = `<button type="button" class="code__copy" data-copy aria-label="Copy code">${icon('copy')}<span>Copy</span></button></div>`;
  const body = panes.map((p) => renderCodePane(p.code, p.lang).replace('<div class="code__pane"', `<div id="${id}-${p.lang}" role="${single ? 'region' : 'tabpanel'}" class="code__pane"`)).join('');
  return `<div class="code${single ? ' code--single' : ''}">${head}${copy}${body}</div>`;
}

function doCode(attrs, inner, rep, off) {
  const single = 'single' in attrs;
  const panes = [];
  const re = /<pre\s+lang\s*=\s*"([^"]*)"\s*>([\s\S]*?)<\/pre>/gi;
  let m;
  let rest = inner;
  while ((m = re.exec(inner))) {
    const lang = m[1].trim();
    if (!CODE_LANGS.includes(lang)) rep.error(`<x-code>: unknown lang "${lang}". Use one of: ${CODE_LANGS.join(', ')}.`, off);
    const code = dedent(m[2]);
    if (/&lt;|&gt;|&amp;/.test(code)) rep.warn('<x-code>: code contains &lt; / &gt; / &amp;. Write code as-is; the build escapes it for you.', off);
    if (!code.trim()) rep.error('<x-code>: empty <pre> block.', off);
    panes.push({ lang, code });
    rest = rest.replace(m[0], '');
  }
  if (rest.trim()) rep.error('<x-code> may only contain <pre lang="…"> blocks. Found other content: ' + JSON.stringify(stripTags(rest).slice(0, 60)), off);
  if (single) {
    if (panes.length !== 1) rep.error('<x-code single> must contain exactly one <pre lang="…"> block.', off);
  } else {
    const langs = panes.map((p) => p.lang).sort().join(',');
    if (langs !== 'js,py') rep.error('<x-code> needs exactly one <pre lang="js"> and one <pre lang="py">. For one language only, write <x-code single>.', off);
    panes.sort((a, b) => (a.lang === 'js' ? -1 : 1) - (b.lang === 'js' ? -1 : 1));
  }
  if (!panes.length) return '';
  return renderCode(panes, { title: attrs.title, single });
}

/* ---------------------------------------------------------------------- */
/* x-tracer                                                                */
/* ---------------------------------------------------------------------- */
const STEP_KEYS = ['caption', 'line', 'array', 'arrays', 'grid', 'tree', 'graph', 'vars'];
const ARRAY_KEYS = ['label', 'values', 'highlight', 'mark', 'dim', 'pointers', 'style'];
const GRID_KEYS = ['label', 'rows', 'rowLabels', 'colLabels', 'highlight', 'mark', 'dim'];
const TREE_KEYS = ['label', 'values', 'highlight', 'mark', 'dim'];
const GRAPH_KEYS = ['label', 'nodes', 'edges', 'directed', 'highlight', 'mark', 'dim', 'highlightEdges', 'labels'];

function fmtCell(v) {
  if (v === null || v === undefined) return '';
  if (typeof v === 'string') return v;
  return JSON.stringify(v).replace(/,/g, ', ');
}

function validateIndexList(list, max, where, rep, off) {
  if (list === undefined) return;
  if (!Array.isArray(list) || !list.every((i) => isInt(i) && i >= 0 && i < max)) rep.error(`${where} must be a list of indexes between 0 and ${max - 1}.`, off);
}

function validateArray(a, where, rep, off) {
  if (!onlyKeys(a, ARRAY_KEYS, where, rep, off)) return;
  if (!Array.isArray(a.values)) return rep.error(`${where}.values must be a list.`, off);
  const n = a.values.length;
  for (const k of ['highlight', 'mark', 'dim']) validateIndexList(a[k], n, `${where}.${k}`, rep, off);
  if (a.pointers !== undefined) {
    if (typeof a.pointers !== 'object' || Array.isArray(a.pointers)) rep.error(`${where}.pointers must be an object like {"L": 0, "R": 4}.`, off);
    else for (const [k, v] of Object.entries(a.pointers)) if (!(isInt(v) && v >= -1 && v <= n)) rep.error(`${where}.pointers.${k} must be an index from -1 to ${n} (one past the end is allowed).`, off);
  }
  if (a.style !== undefined && !['array', 'list'].includes(a.style)) rep.error(`${where}.style must be "array" or "list".`, off);
}

function validateGrid(g, where, rep, off) {
  if (!onlyKeys(g, GRID_KEYS, where, rep, off)) return;
  if (!Array.isArray(g.rows) || !g.rows.every(Array.isArray)) return rep.error(`${where}.rows must be a list of lists.`, off);
  for (const k of ['highlight', 'mark', 'dim']) {
    if (g[k] === undefined) continue;
    if (!Array.isArray(g[k]) || !g[k].every((p) => Array.isArray(p) && p.length === 2 && g.rows[p[0]] && isInt(p[1]) && p[1] >= 0 && p[1] < g.rows[p[0]].length)) rep.error(`${where}.${k} must be a list of [row, col] pairs inside the grid.`, off);
  }
}

function validateTree(t, where, rep, off) {
  if (!onlyKeys(t, TREE_KEYS, where, rep, off)) return;
  if (!Array.isArray(t.values)) return rep.error(`${where}.values must be a list in heap order (children of i are 2i+1 and 2i+2; null for no node).`, off);
  if (t.values.length > 31) rep.error(`${where}.values: at most 31 slots (5 levels).`, off);
  for (const k of ['highlight', 'mark', 'dim']) validateIndexList(t[k], t.values.length, `${where}.${k}`, rep, off);
}

function validateGraph(g, where, rep, off) {
  if (!onlyKeys(g, GRAPH_KEYS, where, rep, off)) return;
  if (!Array.isArray(g.nodes) || !g.nodes.every((n) => n && n.id !== undefined && typeof n.x === 'number' && typeof n.y === 'number' && n.x >= 0 && n.x <= 100 && n.y >= 0 && n.y <= 100)) return rep.error(`${where}.nodes must be a list of {"id": "A", "x": 0-100, "y": 0-100}.`, off);
  const ids = new Set(g.nodes.map((n) => String(n.id)));
  if (!Array.isArray(g.edges || []) || !(g.edges || []).every((e) => Array.isArray(e) && e.length >= 2 && ids.has(String(e[0])) && ids.has(String(e[1])))) rep.error(`${where}.edges must be a list of ["from", "to"] or ["from", "to", weight] using node ids.`, off);
  for (const k of ['highlight', 'mark', 'dim']) if (g[k] !== undefined && (!Array.isArray(g[k]) || !g[k].every((id) => ids.has(String(id))))) rep.error(`${where}.${k} must be a list of node ids.`, off);
  if (g.highlightEdges !== undefined && (!Array.isArray(g.highlightEdges) || !g.highlightEdges.every((e) => Array.isArray(e) && ids.has(String(e[0])) && ids.has(String(e[1]))))) rep.error(`${where}.highlightEdges must be a list of ["from", "to"].`, off);
}

function validateTracer(data, rep, off) {
  if (!onlyKeys(data, ['title', 'code', 'codeLang', 'steps'], '<x-tracer> JSON', rep, off)) return false;
  if (data.code !== undefined && (!Array.isArray(data.code) || !data.code.every((l) => typeof l === 'string'))) rep.error('<x-tracer> "code" must be a list of strings (one per line).', off);
  if (data.codeLang !== undefined && !CODE_LANGS.includes(data.codeLang)) rep.error(`<x-tracer> "codeLang" must be one of ${CODE_LANGS.join(', ')}.`, off);
  if (!Array.isArray(data.steps) || data.steps.length < 2 || data.steps.length > 60) { rep.error('<x-tracer> needs "steps": a list of 2 to 60 steps.', off); return false; }
  data.steps.forEach((s, i) => {
    const w = `<x-tracer> step ${i + 1}`;
    if (!onlyKeys(s, STEP_KEYS, w, rep, off)) return;
    if (typeof s.caption !== 'string' || !s.caption.trim()) rep.error(`${w}: "caption" is required.`, off);
    if (s.line !== undefined) {
      if (!data.code) rep.error(`${w}: "line" needs a top-level "code" list.`, off);
      else if (!(isInt(s.line) && s.line >= 1 && s.line <= data.code.length)) rep.error(`${w}: "line" must be between 1 and ${data.code.length}.`, off);
    }
    if (s.array && s.arrays) rep.error(`${w}: use "array" or "arrays", not both.`, off);
    if (s.array) validateArray(s.array, `${w}.array`, rep, off);
    if (s.arrays) {
      if (!Array.isArray(s.arrays)) rep.error(`${w}.arrays must be a list.`, off);
      else s.arrays.forEach((a, j) => validateArray(a, `${w}.arrays[${j}]`, rep, off));
    }
    if (s.grid) validateGrid(s.grid, `${w}.grid`, rep, off);
    if (s.tree) validateTree(s.tree, `${w}.tree`, rep, off);
    if (s.graph) validateGraph(s.graph, `${w}.graph`, rep, off);
    if (s.vars !== undefined && (typeof s.vars !== 'object' || Array.isArray(s.vars) || s.vars === null)) rep.error(`${w}.vars must be an object like {"sum": 7}.`, off);
    if (!s.array && !s.arrays && !s.grid && !s.tree && !s.graph && !s.vars && s.line === undefined) rep.warn(`${w}: has no state (array, grid, tree, graph, vars or line). The reader only sees the caption.`, off);
  });
  return true;
}

function renderArray(a, prev) {
  const n = a.values.length;
  const ptrAt = {};
  for (const [name, idx] of Object.entries(a.pointers || {})) (ptrAt[idx] = ptrAt[idx] || []).push(name);
  const hl = new Set(a.highlight || []), mk = new Set(a.mark || []), dm = new Set(a.dim || []);
  const slots = Object.keys(ptrAt).some((k) => +k === n) ? n + 1 : n;
  let cells = '';
  if (ptrAt[-1]) cells += `<div class="tr-cell tr-cell--ghost"><span class="tr-val"></span><span class="tr-ptr">${esc(ptrAt[-1].join(' '))}</span></div>`;
  for (let i = 0; i < slots; i++) {
    const ghost = i >= n;
    const cls = ['tr-cell'];
    if (ghost) cls.push('tr-cell--ghost');
    if (hl.has(i)) cls.push('is-hl');
    if (mk.has(i)) cls.push('is-mark');
    if (dm.has(i)) cls.push('is-dim');
    if (!ghost && prev && prev.values && i < prev.values.length && JSON.stringify(prev.values[i]) !== JSON.stringify(a.values[i])) cls.push('is-changed');
    const v = ghost ? '' : fmtCell(a.values[i]);
    cells += `<div class="${cls.join(' ')}">${ghost ? '' : `<span class="tr-idx">${i}</span>`}<span class="tr-val${v.length > 4 ? ' tr-val--long' : ''}">${esc(v)}</span>${ptrAt[i] ? `<span class="tr-ptr">${esc(ptrAt[i].join(' '))}</span>` : '<span class="tr-ptr"></span>'}</div>`;
    if (a.style === 'list' && i < n - 1) cells += '<span class="tr-arrow" aria-hidden="true">→</span>';
  }
  if (a.style === 'list') cells += '<span class="tr-arrow" aria-hidden="true">→</span><span class="tr-null">null</span>';
  return `<div class="tr-array${a.style === 'list' ? ' tr-array--list' : ''}">${a.label ? `<div class="tr-label">${esc(a.label)}</div>` : ''}<div class="tr-cells">${cells}</div></div>`;
}

function renderGrid(g, prev) {
  const key = (r, c) => r + ',' + c;
  const hl = new Set((g.highlight || []).map((p) => key(...p)));
  const mk = new Set((g.mark || []).map((p) => key(...p)));
  const dm = new Set((g.dim || []).map((p) => key(...p)));
  let html = '<table class="tr-grid">';
  if (g.colLabels) html += `<thead><tr>${g.rowLabels ? '<th></th>' : ''}${g.colLabels.map((c) => `<th scope="col">${esc(fmtCell(c))}</th>`).join('')}</tr></thead>`;
  html += '<tbody>';
  g.rows.forEach((row, r) => {
    html += '<tr>' + (g.rowLabels ? `<th scope="row">${esc(fmtCell(g.rowLabels[r]))}</th>` : '');
    row.forEach((v, c) => {
      const cls = [];
      if (hl.has(key(r, c))) cls.push('is-hl');
      if (mk.has(key(r, c))) cls.push('is-mark');
      if (dm.has(key(r, c))) cls.push('is-dim');
      if (prev && prev.rows && prev.rows[r] && JSON.stringify(prev.rows[r][c]) !== JSON.stringify(v)) cls.push('is-changed');
      html += `<td${cls.length ? ` class="${cls.join(' ')}"` : ''}>${esc(fmtCell(v))}</td>`;
    });
    html += '</tr>';
  });
  html += '</tbody></table>';
  return `<div class="tr-gridwrap">${g.label ? `<div class="tr-label">${esc(g.label)}</div>` : ''}${html}</div>`;
}

function renderTree(t) {
  const vals = t.values;
  const levels = Math.max(1, Math.ceil(Math.log2(vals.length + 1)));
  const W = 100 * Math.pow(2, levels - 1) > 400 ? 400 : Math.max(160, 50 * Math.pow(2, levels - 1));
  const H = levels * 56 + 8;
  const pos = (i) => {
    const d = Math.floor(Math.log2(i + 1));
    const p = i - (Math.pow(2, d) - 1);
    return { x: ((p + 0.5) / Math.pow(2, d)) * W, y: 26 + d * 56 };
  };
  const hl = new Set(t.highlight || []), mk = new Set(t.mark || []), dm = new Set(t.dim || []);
  let edges = '', nodes = '';
  vals.forEach((v, i) => {
    if (v === null || v === undefined) return;
    const a = pos(i);
    for (const c of [2 * i + 1, 2 * i + 2]) if (c < vals.length && vals[c] !== null && vals[c] !== undefined) {
      const b = pos(c);
      edges += `<line class="tr-edge" x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"/>`;
    }
    const cls = ['tr-node'];
    if (hl.has(i)) cls.push('is-hl');
    if (mk.has(i)) cls.push('is-mark');
    if (dm.has(i)) cls.push('is-dim');
    nodes += `<g class="${cls.join(' ')}"><circle cx="${a.x}" cy="${a.y}" r="17"/><text x="${a.x}" y="${a.y}" dy="0.35em" text-anchor="middle">${esc(fmtCell(v))}</text></g>`;
  });
  return `<div class="tr-tree">${t.label ? `<div class="tr-label">${esc(t.label)}</div>` : ''}<svg viewBox="-20 0 ${W + 40} ${H}" role="img" aria-label="${esc(t.label || 'tree')}">${edges}${nodes}</svg></div>`;
}

function renderGraph(g) {
  const W = 400;
  const maxY = Math.max(...g.nodes.map((n) => n.y), 10);
  const H = Math.round((maxY / 100) * W) + 60;
  const P = (n) => ({ x: 30 + (n.x / 100) * (W - 60), y: 30 + (n.y / 100) * (W - 60) });
  const byId = new Map(g.nodes.map((n) => [String(n.id), P(n)]));
  const hl = new Set((g.highlight || []).map(String)), mk = new Set((g.mark || []).map(String)), dm = new Set((g.dim || []).map(String));
  const hlE = new Set((g.highlightEdges || []).map((e) => `${e[0]}>${e[1]}`));
  const isHlEdge = (a, b) => hlE.has(`${a}>${b}`) || (!g.directed && hlE.has(`${b}>${a}`));
  let edges = '', labels = '';
  for (const e of g.edges || []) {
    const a = byId.get(String(e[0])), b = byId.get(String(e[1]));
    const dx = b.x - a.x, dy = b.y - a.y, len = Math.hypot(dx, dy) || 1;
    const r = 18;
    const x1 = a.x + (dx / len) * r, y1 = a.y + (dy / len) * r, x2 = b.x - (dx / len) * (r + (g.directed ? 3 : 0)), y2 = b.y - (dy / len) * (r + (g.directed ? 3 : 0));
    edges += `<line class="tr-edge${isHlEdge(e[0], e[1]) ? ' is-hl' : ''}" x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}"${g.directed ? ' marker-end="url(#tr-arrow)"' : ''}/>`;
    if (e.length > 2 && e[2] !== null) {
      const mx = (a.x + b.x) / 2 - (dy / len) * 10, my = (a.y + b.y) / 2 + (dx / len) * 10;
      labels += `<text class="tr-weight" x="${mx.toFixed(1)}" y="${my.toFixed(1)}" dy="0.35em" text-anchor="middle">${esc(fmtCell(e[2]))}</text>`;
    }
  }
  let nodes = '';
  for (const n of g.nodes) {
    const p = byId.get(String(n.id));
    const id = String(n.id);
    const cls = ['tr-node'];
    if (hl.has(id)) cls.push('is-hl');
    if (mk.has(id)) cls.push('is-mark');
    if (dm.has(id)) cls.push('is-dim');
    nodes += `<g class="${cls.join(' ')}"><circle cx="${p.x}" cy="${p.y}" r="17"/><text x="${p.x}" y="${p.y}" dy="0.35em" text-anchor="middle">${esc(id)}</text>`;
    if (g.labels && g.labels[id] !== undefined) nodes += `<text class="tr-nodelabel" x="${p.x}" y="${p.y + 31}" text-anchor="middle">${esc(fmtCell(g.labels[id]))}</text>`;
    nodes += '</g>';
  }
  const defs = g.directed ? '<defs><marker id="tr-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0 0 10 5 0 10z" class="tr-arrowhead"/></marker></defs>' : '';
  return `<div class="tr-graph">${g.label ? `<div class="tr-label">${esc(g.label)}</div>` : ''}<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(g.label || 'graph')}">${defs}${edges}${labels}${nodes}</svg></div>`;
}

function renderVars(vars, prev) {
  return `<dl class="tr-vars">${Object.entries(vars)
    .map(([k, v]) => {
      const changed = prev && Object.prototype.hasOwnProperty.call(prev, k) && JSON.stringify(prev[k]) !== JSON.stringify(v);
      return `<div class="tr-var${changed ? ' is-changed' : ''}"><dt>${esc(k)}</dt><dd>${esc(fmtCell(v === null ? 'null' : v))}</dd></div>`;
    })
    .join('')}</dl>`;
}

export function renderTracer(data, title) {
  const t = title || data.title || 'Step through it';
  let prev = {};
  const steps = data.steps.map((s, i) => {
    let state = '';
    const arrays = s.arrays || (s.array ? [s.array] : []);
    const prevArrays = prev.arrays || (prev.array ? [prev.array] : []);
    arrays.forEach((a, j) => (state += renderArray(a, prevArrays[j])));
    if (s.grid) state += renderGrid(s.grid, prev.grid);
    if (s.tree) state += renderTree(s.tree);
    if (s.graph) state += renderGraph(s.graph);
    if (s.vars) state += renderVars(s.vars, prev.vars);
    prev = s;
    return `<li class="tracer__step"${s.line ? ` data-line="${s.line}"` : ''}><div class="tracer__state">${state}</div><p class="tracer__caption"><span class="tracer__num">${i + 1}</span><span class="tracer__text">${s.caption}</span></p></li>`;
  });
  let code = '';
  if (data.code) {
    const lines = highlightLines(data.code.join('\n'), data.codeLang || 'text');
    code = `<div class="tracer__code"><pre><code>${lines.map((l, i) => `<span class="ln" data-ln="${i + 1}">${l || ' '}</span>`).join('')}</code></pre></div>`;
  }
  const controls = `<div class="tracer__controls">
<button type="button" class="btn-icon" data-tr="prev" aria-label="Previous step">${icon('prev')}</button>
<button type="button" class="btn-icon tracer__play" data-tr="play" aria-label="Play">${icon('play', 'icon i-play')}${icon('pause', 'icon i-pause')}</button>
<button type="button" class="btn-icon" data-tr="next" aria-label="Next step">${icon('next')}</button>
<input type="range" class="tracer__range" min="1" max="${steps.length}" value="1" aria-label="Step">
<span class="tracer__count" aria-live="polite"><span data-tr-cur>1</span> / ${steps.length}</span>
</div>`;
  return `<figure class="tracer${code ? ' tracer--code' : ''}" data-tracer tabindex="-1">
<figcaption class="tracer__head">${icon('target')}<span class="tracer__title">${esc(t)}</span><span class="tracer__hint">Use the arrows or ← → keys</span></figcaption>
<div class="tracer__body">${code}<ol class="tracer__steps">${steps.join('')}</ol></div>${controls}</figure>`;
}

function doTracer(attrs, inner, rep, off) {
  const data = parseJsonBlock(inner, 'x-tracer', rep, off);
  if (!data) return '';
  if (!validateTracer(data, rep, off)) return '';
  try { return renderTracer(data, attrs.title); } catch (e) { rep.error('<x-tracer> could not be rendered: ' + e.message, off); return ''; }
}

/* ---------------------------------------------------------------------- */
/* x-quiz                                                                  */
/* ---------------------------------------------------------------------- */
let quizCounter = 0;
function doQuiz(attrs, inner, rep, off) {
  const data = parseJsonBlock(inner, 'x-quiz', rep, off);
  if (!data) return '';
  if (!onlyKeys(data, ['questions'], '<x-quiz> JSON', rep, off)) return '';
  if (!Array.isArray(data.questions) || !data.questions.length) { rep.error('<x-quiz> needs "questions": a non-empty list.', off); return ''; }
  let ok = true;
  data.questions.forEach((q, i) => {
    const w = `<x-quiz> question ${i + 1}`;
    if (!onlyKeys(q, ['question', 'options'], w, rep, off)) { ok = false; return; }
    if (typeof q.question !== 'string' || !q.question.trim()) { rep.error(`${w}: "question" is required.`, off); ok = false; }
    if (!Array.isArray(q.options) || q.options.length < 2 || q.options.length > 5) { rep.error(`${w}: needs 2 to 5 "options".`, off); ok = false; return; }
    q.options.forEach((o, j) => {
      if (!onlyKeys(o, ['text', 'correct', 'why'], `${w} option ${j + 1}`, rep, off)) { ok = false; return; }
      if (typeof o.text !== 'string' || !o.text.trim()) { rep.error(`${w} option ${j + 1}: "text" is required.`, off); ok = false; }
      if (typeof o.why !== 'string' || !o.why.trim()) { rep.error(`${w} option ${j + 1}: "why" is required. Explain why this option is right or wrong.`, off); ok = false; }
      if (o.correct !== undefined && typeof o.correct !== 'boolean') { rep.error(`${w} option ${j + 1}: "correct" must be true or false.`, off); ok = false; }
    });
    const nCorrect = q.options.filter((o) => o.correct === true).length;
    if (nCorrect !== 1) { rep.error(`${w}: exactly one option must have "correct": true (found ${nCorrect}).`, off); ok = false; }
  });
  if (!ok) return '';
  const qs = data.questions.map((q) => {
    const id = `quiz-${++quizCounter}`;
    return `<div class="quiz__q" data-quiz-q>
<p class="quiz__prompt" id="${id}">${q.question}</p>
<ol class="quiz__options" role="list" aria-labelledby="${id}">${q.options
      .map((o, j) => `<li><button type="button" class="quiz__opt" data-correct="${o.correct === true}"><span class="quiz__letter">${String.fromCharCode(65 + j)}</span><span class="quiz__text">${o.text}</span>${icon('check', 'icon quiz__icon quiz__icon--ok')}${icon('x', 'icon quiz__icon quiz__icon--no')}</button><div class="quiz__why" hidden><strong>${o.correct ? 'Right.' : 'Not quite.'}</strong> ${o.why}</div></li>`)
      .join('')}</ol></div>`;
  });
  return `<section class="quiz" data-quiz aria-label="Quick check"><div class="quiz__head">${icon('check')}<span>${esc(attrs.title || 'Quick check')}</span></div>${qs.join('')}</section>`;
}

/* ---------------------------------------------------------------------- */
/* x-complexity                                                            */
/* ---------------------------------------------------------------------- */
function bigO(s) {
  return `<span class="bigo">${esc(s)}</span>`;
}
function doComplexity(attrs, inner, rep, off) {
  const data = parseJsonBlock(inner, 'x-complexity', rep, off);
  if (!data) return '';
  if (!onlyKeys(data, ['rows'], '<x-complexity> JSON', rep, off)) return '';
  if (!Array.isArray(data.rows) || !data.rows.length) { rep.error('<x-complexity> needs "rows": a non-empty list.', off); return ''; }
  let ok = true;
  data.rows.forEach((r, i) => {
    if (!onlyKeys(r, ['name', 'time', 'space', 'note'], `<x-complexity> row ${i + 1}`, rep, off)) { ok = false; return; }
    if (typeof r.time !== 'string' || !r.time) { rep.error(`<x-complexity> row ${i + 1}: "time" is required, like "O(n)".`, off); ok = false; }
    if (r.space !== undefined && typeof r.space !== 'string') { rep.error(`<x-complexity> row ${i + 1}: "space" must be a string.`, off); ok = false; }
    if (data.rows.length > 1 && !r.name) { rep.error(`<x-complexity> row ${i + 1}: "name" is required when there is more than one row.`, off); ok = false; }
  });
  if (!ok) return '';
  const hasSpace = data.rows.some((r) => r.space);
  const hasNote = data.rows.some((r) => r.note);
  if (data.rows.length === 1 && !data.rows[0].name) {
    const r = data.rows[0];
    return `<div class="cx cx--badges"><div class="cx__item"><span class="cx__k">Time</span>${bigO(r.time)}</div>${r.space ? `<div class="cx__item"><span class="cx__k">Space</span>${bigO(r.space)}</div>` : ''}${r.note ? `<p class="cx__note">${r.note}</p>` : ''}</div>`;
  }
  return `<div class="cx table-wrap"><table class="cx__table"><thead><tr><th scope="col">Approach</th><th scope="col">Time</th>${hasSpace ? '<th scope="col">Space</th>' : ''}${hasNote ? '<th scope="col">Why</th>' : ''}</tr></thead><tbody>${data.rows
    .map((r) => `<tr><th scope="row">${r.name ? r.name : ''}</th><td>${bigO(r.time)}</td>${hasSpace ? `<td>${r.space ? bigO(r.space) : ''}</td>` : ''}${hasNote ? `<td>${r.note || ''}</td>` : ''}</tr>`)
    .join('')}</tbody></table></div>`;
}

/* ---------------------------------------------------------------------- */
/* x-figure                                                                */
/* ---------------------------------------------------------------------- */
function doFigure(attrs, inner, rep, off) {
  const svg = inner.match(/<svg\b([^>]*)>([\s\S]*)<\/svg>/i);
  const img = inner.match(/<img\b[^>]*>/i);
  if (!svg && !img) { rep.error('<x-figure> must contain an inline <svg> (or an <img>).', off); return ''; }
  let media;
  if (svg) {
    const a = parseAttrs(svg[1]);
    if (!a.viewbox) rep.error('<x-figure> <svg> needs a viewBox attribute, e.g. viewBox="0 0 400 200". Do not set fixed width/height.', off);
    if (/\b(fill|stroke)\s*=\s*"#[0-9a-f]{3,8}"/i.test(svg[0]) || /(fill|stroke)\s*:\s*#[0-9a-f]{3,8}/i.test(svg[0])) rep.warn('<x-figure>: hard-coded colors break dark mode. Use the f-* / s-* classes from the authoring guide.', off);
    if (!a['aria-label'] && !/<title>/.test(svg[2])) rep.warn('<x-figure>: add aria-label="…" to the <svg> describing what it shows.', off);
    let open = svg[0].replace(/^<svg\b/i, '<svg');
    open = open.replace(/^<svg([^>]*)>/i, (m0, at) => {
      let s = at.replace(/\s(width|height)\s*=\s*"[^"]*"/gi, '');
      if (!/\brole=/.test(s)) s += ' role="img"';
      return `<svg${s}>`;
    });
    media = open;
  } else {
    const a = parseAttrs(img[0].slice(4, -1));
    if (!a.alt) rep.error('<x-figure> <img> needs alt text.', off);
    if (a.src && !a.src.startsWith('/')) rep.error('<x-figure> <img> src must be root-absolute, like /images/foo.png.', off);
    media = img[0].replace(/^<img/i, '<img loading="lazy"');
  }
  const cap = attrs.caption ? `<figcaption>${esc(attrs.caption)}</figcaption>` : '';
  return `<figure class="fig${'wide' in attrs ? ' fig--wide' : ''}"><div class="fig__media">${media}</div>${cap}</figure>`;
}

/* ---------------------------------------------------------------------- */
/* x-prompt                                                                */
/* ---------------------------------------------------------------------- */
const ROLE_LABEL = { 'x-system': 'System prompt', 'x-user': 'You', 'x-model': 'Model' };
function doPrompt(attrs, inner, rep, off) {
  const turns = [];
  const re = /<(x-system|x-user|x-model)>([\s\S]*?)<\/\1>/g;
  let m, rest = inner;
  while ((m = re.exec(inner))) {
    turns.push({ role: m[1], text: dedent(m[2]) });
    rest = rest.replace(m[0], '');
  }
  if (rest.trim()) rep.error('<x-prompt> may only contain <x-system>, <x-user> and <x-model> blocks.', off);
  if (!turns.some((t) => t.role === 'x-user')) rep.error('<x-prompt> needs at least one <x-user> block.', off);
  if (attrs.tone && !['weak', 'good', 'neutral'].includes(attrs.tone)) rep.error('<x-prompt> tone must be "weak", "good" or "neutral".', off);
  const tone = attrs.tone || 'neutral';
  const label = attrs.label ? `<span class="convo__label convo__label--${tone}">${tone === 'weak' ? icon('x') : tone === 'good' ? icon('check') : icon('chat')}${esc(attrs.label)}</span>` : `<span class="convo__label">${icon('chat')}Example</span>`;
  const body = turns
    .map((t) => `<div class="convo__turn convo__turn--${t.role.slice(2)}"><div class="convo__role">${ROLE_LABEL[t.role]}</div><div class="convo__text">${esc(t.text)}</div></div>`)
    .join('');
  return `<figure class="convo convo--${tone}"><figcaption class="convo__head">${label}<span class="convo__note">Illustrative example. Real replies vary.</span></figcaption>${body}</figure>`;
}

/* ---------------------------------------------------------------------- */
/* x-tryit                                                                 */
/* ---------------------------------------------------------------------- */
let tryCounter = 0;
function doTryit(attrs, inner, rep, off) {
  const get = (name) => {
    const all = [...inner.matchAll(new RegExp(`<${name}>([\\s\\S]*?)</${name}>`, 'g'))];
    if (all.length > 1) rep.error(`<x-tryit> may contain only one <${name}>.`, off);
    return all[0] ? all[0][1] : null;
  };
  const task = get('x-task'), start = get('x-start'), answer = get('x-answer');
  const rest = inner.replace(/<(x-task|x-start|x-answer)>[\s\S]*?<\/\1>/g, '');
  if (rest.trim()) rep.error('<x-tryit> may only contain <x-task>, <x-start> and <x-answer>.', off);
  if (!task || !task.trim()) rep.error('<x-tryit> needs an <x-task> describing what to do.', off);
  if (!answer || !answer.trim()) rep.error('<x-tryit> needs an <x-answer> with a sample answer and the reasoning.', off);
  const id = `tryit-${++tryCounter}`;
  const startText = start ? dedent(start) : '';
  const rows = Math.min(14, Math.max(4, startText.split('\n').length + 1));
  return `<section class="tryit" data-tryit aria-labelledby="${id}-h">
<div class="tryit__head">${icon('pencil')}<span id="${id}-h">${esc(attrs.title ? 'Try it: ' + attrs.title : 'Try it')}</span></div>
<div class="tryit__task">${task || ''}</div>
<label class="tryit__label" for="${id}-ta">${start ? 'Rewrite it here' : 'Your answer'}</label>
<textarea class="tryit__input" id="${id}-ta" rows="${rows}" spellcheck="true" data-tryit-input placeholder="Write your version here. It stays on this device.">${esc(startText)}</textarea>
<details class="tryit__answer"><summary>${icon('sparkle')}Show a sample answer</summary><div class="tryit__answer-body">${answer || ''}</div></details>
</section>`;
}

/* ---------------------------------------------------------------------- */
/* x-callout                                                               */
/* ---------------------------------------------------------------------- */
function doCallout(attrs, inner, rep, off) {
  const type = attrs.type;
  if (!CALLOUT_TYPES[type]) { rep.error(`<x-callout> type must be one of: ${Object.keys(CALLOUT_TYPES).join(', ')}.`, off); return ''; }
  if (!inner.trim()) rep.error('<x-callout> is empty.', off);
  const body = /^\s*</.test(inner) ? inner : `<p>${inner.trim()}</p>`;
  return `<aside class="callout callout--${type}"><div class="callout__head">${icon(type)}<span>${esc(attrs.title || CALLOUT_TYPES[type])}</span></div><div class="callout__body">${body}</div></aside>`;
}

const RENDERERS = { 'x-code': doCode, 'x-tracer': doTracer, 'x-quiz': doQuiz, 'x-complexity': doComplexity, 'x-figure': doFigure, 'x-prompt': doPrompt, 'x-tryit': doTryit, 'x-callout': doCallout };

/* ---------------------------------------------------------------------- */
/* tag balance check                                                       */
/* ---------------------------------------------------------------------- */
const VOID = new Set(['area', 'base', 'br', 'col', 'embed', 'hr', 'img', 'input', 'link', 'meta', 'source', 'track', 'wbr']);
const CHECKED = new Set(['p', 'div', 'section', 'ul', 'ol', 'li', 'table', 'thead', 'tbody', 'tfoot', 'tr', 'td', 'th', 'figure', 'figcaption', 'details', 'summary', 'blockquote', 'strong', 'em', 'b', 'i', 'code', 'a', 'span', 'h2', 'h3', 'h4', 'dl', 'dt', 'dd', 'kbd', 'sup', 'sub', 'mark', 'small', 'caption', ...COMPONENT_NAMES, ...CHILD_NAMES]);

function blank(s) { return s.replace(/[^\n]/g, ' '); }

// Hide raw-content regions (code, scripts, svg, comments, prompt turns) but keep offsets.
function maskRaw(src) {
  return src
    .replace(/<!--[\s\S]*?-->/g, blank)
    .replace(/(<pre\b[^>]*>)([\s\S]*?)(<\/pre>)/gi, (m, a, b, c) => a + blank(b) + c)
    .replace(/(<script\b[^>]*>)([\s\S]*?)(<\/script>)/gi, (m, a, b, c) => a + blank(b) + c)
    .replace(/<svg\b[\s\S]*?<\/svg>/gi, blank)
    .replace(/(<(x-user|x-model|x-system|x-start)>)([\s\S]*?)(<\/\2>)/g, (m, a, n, b, c) => a + blank(b) + c);
}

export function checkBalance(src, rep) {
  const s = maskRaw(src);
  const stack = [];
  const re = /<\/?([a-zA-Z][a-zA-Z0-9-]*)\b[^>]*?(\/?)>/g;
  let m;
  while ((m = re.exec(s))) {
    const name = m[1].toLowerCase();
    const closing = m[0][1] === '/';
    if (VOID.has(name) || m[2] === '/') continue;
    if (!CHECKED.has(name)) continue;
    if (!closing) stack.push({ name, off: m.index });
    else {
      if (!stack.length) { rep.error(`Closing </${name}> has no matching opening tag.`, m.index); continue; }
      const top = stack[stack.length - 1];
      if (top.name === name) stack.pop();
      else {
        rep.error(`<${top.name}> is not closed before </${name}>. Close every tag you open (including </p> and </li>).`, top.off);
        const idx = stack.map((x) => x.name).lastIndexOf(name);
        if (idx >= 0) stack.length = idx;
      }
    }
  }
  for (const t of stack) rep.error(`<${t.name}> is never closed.`, t.off);
}

/* ---------------------------------------------------------------------- */
/* voice lint                                                              */
/* ---------------------------------------------------------------------- */
export const BANNED = [
  [/\bdelv(e|es|ing)\b/i, '"delve"'],
  [/\bdiv(e|ing) (in|into)\b/i, '"dive in/into"'],
  [/\blet['’]?s explore\b/i, '"let\'s explore"'],
  [/\bin today['’]s world\b/i, '"in today\'s world"'],
  [/\bin the realm of\b/i, '"in the realm of"'],
  [/\bit['’]?s important to note\b/i, '"it\'s important to note"'],
  [/\bcrucial(ly)?\b/i, '"crucial"'],
  [/\bleverag(e|es|ed|ing)\b/i, '"leverage"'],
  [/\bunlock(s|ed|ing)?\b/i, '"unlock"'],
  [/\bharness(es|ed|ing)?\b(?! (the )?(test|runs?|checks?))/i, '"harness" (as a verb)'],
  [/\bgame[- ]changer\b/i, '"game-changer"'],
  [/\bnavigat(e|ing) the (complex )?landscape\b/i, '"navigate the landscape"'],
  [/\btapestry\b/i, '"tapestry"'],
  [/\brobust(ly|ness)?\b/i, '"robust"'],
  [/\bseamless(ly)?\b/i, '"seamless"'],
  [/\bin conclusion\b/i, '"In conclusion"'],
  [/\bbuckle up\b/i, '"buckle up"'],
  [/\bnot (just|only|merely) [^.;:!?]{1,60}?,? but (also )?/i, '"not just X but Y" construction'],
  [/\bin this (lesson|article|post|guide|tutorial),? (we|you)(['’]ll| will)\b/i, 'filler intro ("In this lesson we will…")'],
  [/\b(have you ever wondered|ever wondered)\b/i, 'rhetorical question opener'],
  [/\bwithout further ado\b/i, '"without further ado"'],
];

export function voiceLint(text, rep, off) {
  for (const [re, label] of BANNED) {
    const m = text.match(re);
    if (m) rep.warn(`Voice: avoid ${label} (found "${m[0]}").`, off);
  }
  if (/\p{Extended_Pictographic}/u.test(text)) rep.warn('Voice: no emoji in learner-facing text.', off);
  const bang = text.match(/[A-Za-z)][!](\s|$)/);
  if (bang) rep.warn('Voice: avoid exclamation marks in prose.', off);
}

/* ---------------------------------------------------------------------- */
/* main entry                                                              */
/* ---------------------------------------------------------------------- */

// ctx: { resolveLink(href) -> {ok:true} | {missing:true, text} | {error: msg} }
export function processLessonBody(body, { lineOffset = 1, resolveLink, track } = {}) {
  const errors = [], warnings = [];
  const rep = makeReporter(body, lineOffset, errors, warnings);
  checkBalance(body, rep);
  // components are blocks: one inside an open <p> produces broken HTML
  for (const m of maskRaw(body).matchAll(/<p\b[^>]*>((?:(?!<\/p>)[\s\S])*?)<(x-(?:code|tracer|quiz|complexity|figure|prompt|tryit|callout))\b/g)) {
    rep.error(`<${m[2]}> is inside a <p>. Components are blocks: close the paragraph first.`, m.index + m[0].length - m[2].length - 1);
  }

  const stash = [];
  const put = (html) => `\u0000${stash.push(html) - 1}\u0000`;
  let html = body;
  const used = {};
  const proseBits = [];
  let jsonWords = 0;

  for (const name of COMPONENT_NAMES) {
    const re = new RegExp(`<${name}\\b([^>]*)>([\\s\\S]*?)</${name}>`, 'g');
    html = html.replace(re, (m, attrStr, inner, offset) => {
      const off = body.indexOf(m) >= 0 ? body.indexOf(m) : offset;
      used[name] = (used[name] || 0) + 1;
      const attrs = parseAttrs(attrStr);
      if (name === 'x-tracer' || name === 'x-quiz') {
        const j = inner.match(/<script[^>]*>([\s\S]*?)<\/script>/);
        if (j) try { const bits = []; collectStrings(JSON.parse(j[1]), bits); proseBits.push(...bits); jsonWords += stripTags(bits.join(' ')).split(/\s+/).filter(Boolean).length; } catch {}
      }
      if (name === 'x-callout' || name === 'x-tryit') proseBits.push(inner.replace(/<x-start>[\s\S]*?<\/x-start>/g, ''));
      return put(RENDERERS[name](attrs, inner, rep, off));
    });
  }

  // anything x-* left over is a typo or a nesting mistake
  const reported = new Set();
  for (const m of html.matchAll(/<\/?(x-[a-z-]+)/g)) {
    if (reported.has(m[1])) continue;
    reported.add(m[1]);
    const off = body.indexOf(m[0]);
    if (COMPONENT_NAMES.includes(m[1]) || CHILD_NAMES.includes(m[1])) rep.error(`<${m[1]}> is misplaced or not closed properly.`, off);
    else rep.error(`Unknown component <${m[1]}>. Components: ${COMPONENT_NAMES.join(', ')}.`, off);
  }
  for (const [re, msg] of [
    [/<h1\b/i, 'Do not use <h1>; the page title comes from the front matter. Start sections with <h2>.'],
    [/<pre\b/i, 'Put code inside <x-code> (or <x-code single>), not a bare <pre>.'],
    [/<script\b/i, 'No <script> tags in lessons, except the JSON block inside a component.'],
    [/<style\b/i, 'No <style> tags in lessons. Use the components and classes from the authoring guide.'],
    [/<iframe\b/i, 'No <iframe> embeds in lessons.'],
  ]) {
    const m = html.match(re);
    if (m) rep.error(msg, body.indexOf(m[0]));
  }
  if (/\sstyle\s*=/.test(html.replace(/<svg[\s\S]*?<\/svg>/g, ''))) rep.warn('Avoid inline style="…" attributes; they break theming.', body.search(/\sstyle\s*=/));

  // headings -> ids + TOC
  const toc = [];
  const ids = new Set();
  html = html.replace(/<h([23])\b([^>]*)>([\s\S]*?)<\/h\1>/g, (m, lvl, attrStr, inner) => {
    const attrs = parseAttrs(attrStr);
    let id = attrs.id || slugify(inner);
    let k = 2;
    while (ids.has(id)) id = `${id}-${k++}`;
    ids.add(id);
    if (lvl === '2') toc.push({ id, text: stripTags(inner) });
    const rest = attrStr.replace(/\sid\s*=\s*"[^"]*"/, '');
    return `<h${lvl} id="${id}"${rest}><a class="anchor" href="#${id}" aria-hidden="true" tabindex="-1">#</a>${inner}</h${lvl}>`;
  });
  if (toc.length < 2) rep.warn('Use at least two <h2> sections so the page gets a table of contents.', 0);

  // tables scroll on small screens
  html = html.replace(/<table\b/g, '<div class="table-wrap"><table').replace(/<\/table>/g, '</table></div>');
  html = html.replace(/<img\b(?![^>]*loading=)/g, '<img loading="lazy"');

  // put components back, then resolve links everywhere (callouts can hold links)
  const unstash = (s) => s.replace(/\u0000(\d+)\u0000/g, (m, i) => unstash(stash[+i]));
  html = unstash(html);

  html = html.replace(/<a\b([^>]*)>([\s\S]*?)<\/a>/g, (m, attrStr, text) => {
    const a = parseAttrs(attrStr);
    const href = a.href;
    if (href === undefined) return m;
    if (/^https?:\/\//.test(href)) {
      if (/^https?:\/\/(www\.)?introtoalgo\.com\//.test(href)) rep.warn(`Use a root-relative link (/…) instead of ${href}.`, body.indexOf(href));
      if (!/target=/.test(attrStr)) return `<a${attrStr} target="_blank" rel="noopener">${text}</a>`;
      return m;
    }
    if (href.startsWith('#') || href.startsWith('mailto:')) return m;
    if (!href.startsWith('/')) { rep.error(`Link "${href}" must be root-absolute (start with /).`, body.indexOf(href)); return m; }
    const r = resolveLink ? resolveLink(href) : { ok: true };
    if (r.error) { rep.error(r.error, body.indexOf(href)); return m; }
    if (r.missing) { if (!r.quiet) rep.warn(`Link ${href}: no such problem yet. Fine if another writer is adding it; until then it renders as plain text.`, body.indexOf(href)); return `<span class="link-soon" title="Coming soon">${text}</span>`; }
    return m;
  });

  // prose for voice lint and word count (no code, no prompt examples)
  const prose = stripTags(
    body
      .replace(/<x-code\b[\s\S]*?<\/x-code>/g, ' ')
      .replace(/<x-prompt\b[\s\S]*?<\/x-prompt>/g, ' ')
      .replace(/<x-(tracer|quiz|complexity)\b[\s\S]*?<\/x-\1>/g, ' ')
      .replace(/<svg[\s\S]*?<\/svg>/g, ' ')
      .replace(/<x-start>[\s\S]*?<\/x-start>/g, ' ')
      .replace(/<code>[\s\S]*?<\/code>/g, ' x ')
  ) + ' ' + stripTags(proseBits.join(' ').replace(/<code>[\s\S]*?<\/code>/g, ' x '));
  voiceLint(prose, rep, 0);
  const firstP = body.match(/<p\b[^>]*>([\s\S]*?)<\/p>/);
  if (firstP && /^[^.!]{0,140}\?/.test(stripTags(firstP[1]))) rep.warn('Voice: the lesson opens with a question. Open with the concrete problem or picture instead.', body.indexOf(firstP[0]));
  // Word count: everything a reader reads as prose, without code, JSON or SVG.
  const words = stripTags(body.replace(/<x-code\b[\s\S]*?<\/x-code>/g, ' ').replace(/<script[\s\S]*?<\/script>/g, ' ').replace(/<svg[\s\S]*?<\/svg>/g, ' ')).split(/\s+/).filter(Boolean).length + jsonWords;

  return { html, toc, errors, warnings, used, words };
}

function collectStrings(v, out) {
  if (typeof v === 'string') out.push(v);
  else if (Array.isArray(v)) v.forEach((x) => collectStrings(x, out));
  else if (v && typeof v === 'object') for (const [k, x] of Object.entries(v)) if (!['values', 'rows', 'code', 'nodes', 'edges', 'pointers', 'vars', 'labels', 'colLabels', 'rowLabels'].includes(k)) collectStrings(x, out);
}

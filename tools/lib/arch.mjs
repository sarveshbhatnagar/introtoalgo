// Architecture diagrams for <x-arch> and the tracer's "arch" state.
//
// The writer places every node on a grid (col, row). The build sizes the grid,
// routes each edge with straight or right-angle lines that avoid other nodes,
// spreads several edges on one side of a node, keeps parallel lines in a gap
// apart, and places edge labels where they do not cover nodes or each other.
// Everything is drawn with CSS classes so it follows the light/dark theme.
import { esc } from './util.mjs';

/* ---------------------------------------------------------------------- */
/* kinds                                                                   */
/* ---------------------------------------------------------------------- */
// family decides the colour; icon is a 24x24 stroke path.
export const ARCH_KINDS = {
  client: { family: 'edge', name: 'client', icon: '<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8M12 16v4"/>' },
  dns: { family: 'net', name: 'DNS', icon: '<path d="M12 3v18"/><path d="M5 5.5h11l2.5 2.5-2.5 2.5H5z"/><path d="M19 13.5H8L5.5 16 8 18.5h11z"/>' },
  cdn: { family: 'net', name: 'CDN', icon: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18"/><path d="M12 3c2.8 3 2.8 15 0 18M12 3c-2.8 3-2.8 15 0 18"/>' },
  'load-balancer': { family: 'net', name: 'load balancer', icon: '<circle cx="12" cy="4.5" r="2"/><circle cx="4.5" cy="19.5" r="2"/><circle cx="12" cy="19.5" r="2"/><circle cx="19.5" cy="19.5" r="2"/><path d="M12 6.5v11M12 10.5l-6.5 7M12 10.5l6.5 7"/>' },
  gateway: { family: 'net', name: 'API gateway', icon: '<path d="M4 20V9l8-5 8 5v11"/><path d="M9 20v-6h6v6"/>' },
  service: { family: 'compute', name: 'service', icon: '<rect x="4" y="4" width="16" height="16" rx="3"/><path d="M9 9h6v6H9z"/>' },
  worker: { family: 'compute', name: 'worker', icon: '<circle cx="12" cy="12" r="3.2"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/>' },
  cache: { family: 'data', name: 'cache', icon: '<path d="M13 2 4 14h7l-1 8 9-12h-7l1-8Z"/>' },
  database: { family: 'data', name: 'database', icon: '<ellipse cx="12" cy="5.5" rx="7" ry="2.5"/><path d="M5 5.5v13c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5v-13"/><path d="M5 12c0 1.4 3.1 2.5 7 2.5s7-1.1 7-2.5"/>' },
  queue: { family: 'msg', name: 'queue', icon: '<rect x="2.5" y="7" width="19" height="10" rx="2"/><path d="M8 7v10M13 7v10M17.5 10.5l1.5 1.5-1.5 1.5"/>' },
  'blob-store': { family: 'data', name: 'blob store', icon: '<path d="M4 6c0-1.1 3.6-2 8-2s8 .9 8 2-3.6 2-8 2-8-.9-8-2Z"/><path d="M4 6l2 13c.2 1.2 2.9 2 6 2s5.8-.8 6-2l2-13"/>' },
  search: { family: 'data', name: 'search index', icon: '<circle cx="10.5" cy="10.5" r="6.5"/><path d="m20 20-4.8-4.8"/>' },
  external: { family: 'edge', name: 'external service', icon: '<path d="M7 18.5a4 4 0 0 1-.6-8 5.5 5.5 0 0 1 10.6-1.5 4 4 0 0 1 .5 9.5H7Z"/>' },
};
export const ROUTES = ['auto', 'straight', 'hv', 'vh', 'hvh', 'vhv'];

const NW = 128, NH = 64; // node box
const COL_GAP = 64, ROW_GAP = 60; // minimum gaps between grid cells
const GP = 12, GL = 18; // group padding, group label band
const LANE = 10; // spacing of parallel lines in one gap
const FONT_EDGE = 11.5, CH_EDGE = 6.9; // edge label font size and mono char width
const LINE_CHARS = 16; // node label characters per line
const MAX_COL = 7, MAX_ROW = 7;

const isInt = (n) => Number.isInteger(n);
const ID_RE = /^[A-Za-z0-9][A-Za-z0-9_-]*$/;

/* ---------------------------------------------------------------------- */
/* validation                                                              */
/* ---------------------------------------------------------------------- */
export function wrapLabel(label) {
  const words = String(label).trim().split(/\s+/);
  const lines = [];
  let cur = '';
  for (const w of words) {
    if (!cur) cur = w;
    else if ((cur + ' ' + w).length <= LINE_CHARS) cur += ' ' + w;
    else { lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);
  return lines;
}

// rep: { error(msg, off), warn(msg, off) }. Returns true if the diagram can be drawn.
export function validateArch(d, where, rep, off) {
  let ok = true;
  const E = (m) => { rep.error(`${where}: ${m}`, off); ok = false; };
  if (!d || typeof d !== 'object' || Array.isArray(d)) { E('must be an object with "nodes" and "edges".'); return false; }
  for (const k of Object.keys(d)) if (!['nodes', 'edges', 'title'].includes(k)) E(`unknown key "${k}". Allowed: nodes, edges, title.`);
  if (!Array.isArray(d.nodes) || d.nodes.length < 2 || d.nodes.length > 24) { E('"nodes" must be a list of 2 to 24 nodes.'); return false; }
  const ids = new Set();
  const cells = new Map();
  d.nodes.forEach((n, i) => {
    const w = `node ${i + 1}${n && n.id ? ` ("${n.id}")` : ''}`;
    if (!n || typeof n !== 'object') return E(`${w} must be an object.`);
    for (const k of Object.keys(n)) if (!['id', 'label', 'kind', 'col', 'row', 'group', 'stack'].includes(k)) E(`${w}: unknown key "${k}". Allowed: id, label, kind, col, row, group, stack.`);
    if (typeof n.id !== 'string' || !ID_RE.test(n.id)) E(`${w}: "id" must be a short string of letters, digits, - or _ (like "app" or "db-primary").`);
    else if (ids.has(n.id)) E(`${w}: id "${n.id}" is used twice.`);
    else ids.add(n.id);
    if (typeof n.label !== 'string' || !n.label.trim()) E(`${w}: "label" is required (what the box says, like "App server").`);
    else {
      const lines = wrapLabel(n.label);
      if (lines.length > 2 || lines.some((l) => l.length > LINE_CHARS)) E(`${w}: label "${n.label}" does not fit. Use at most two lines of ${LINE_CHARS} characters (about 30 characters, no very long words).`);
    }
    if (!ARCH_KINDS[n.kind]) E(`${w}: "kind" must be one of: ${Object.keys(ARCH_KINDS).join(', ')}.`);
    if (!isInt(n.col) || n.col < 0 || n.col > MAX_COL) E(`${w}: "col" must be a whole number from 0 to ${MAX_COL} (0 is the left column).`);
    if (!isInt(n.row) || n.row < 0 || n.row > MAX_ROW) E(`${w}: "row" must be a whole number from 0 to ${MAX_ROW} (0 is the top row).`);
    if (isInt(n.col) && isInt(n.row)) {
      const key = `${n.col},${n.row}`;
      if (cells.has(key)) E(`${w}: col ${n.col}, row ${n.row} is already taken by "${cells.get(key)}". One node per grid cell.`);
      else cells.set(key, n.id);
    }
    if (n.group !== undefined && (typeof n.group !== 'string' || !n.group.trim() || n.group.length > 28)) E(`${w}: "group" must be a short label (at most 28 characters), shared by every node in the group.`);
    if (n.stack !== undefined && typeof n.stack !== 'boolean') E(`${w}: "stack" must be true or false (true draws it as several copies).`);
  });
  if (d.title !== undefined && typeof d.title !== 'string') E('"title" must be a string.');
  if (!Array.isArray(d.edges)) { E('"edges" must be a list (it may be empty).'); return false; }
  const pairs = new Map();
  const edgeIds = new Set();
  d.edges.forEach((e, i) => {
    const w = `edge ${i + 1}${e && e.from ? ` (${e.from} → ${e.to})` : ''}`;
    if (!e || typeof e !== 'object' || Array.isArray(e)) return E(`${w} must be an object like {"from": "app", "to": "db"}.`);
    for (const k of Object.keys(e)) if (!['from', 'to', 'label', 'style', 'route', 'arrow', 'id'].includes(k)) E(`${w}: unknown key "${k}". Allowed: from, to, label, style, route, arrow, id.`);
    if (!ids.has(e.from)) E(`${w}: "from" must be a node id. Got ${JSON.stringify(e.from)}.`);
    if (!ids.has(e.to)) E(`${w}: "to" must be a node id. Got ${JSON.stringify(e.to)}.`);
    if (e.from === e.to) E(`${w}: an edge cannot connect a node to itself.`);
    if (e.label !== undefined && (typeof e.label !== 'string' || !e.label.trim() || e.label.length > 22)) E(`${w}: "label" must be short text, at most 22 characters (like "GET /u/abc" or "cache miss").`);
    if (e.style !== undefined && !['sync', 'async'].includes(e.style)) E(`${w}: "style" must be "sync" (solid line, a request that waits for a reply) or "async" (dashed line, fire and forget).`);
    if (e.route !== undefined && !ROUTES.includes(e.route)) E(`${w}: "route" must be one of: ${ROUTES.join(', ')}.`);
    if (e.arrow !== undefined && !['end', 'both', 'none'].includes(e.arrow)) E(`${w}: "arrow" must be "end" (default), "both" or "none".`);
    if (e.id !== undefined) {
      if (typeof e.id !== 'string' || !ID_RE.test(e.id)) E(`${w}: "id" must be a short string of letters, digits, - or _.`);
      else if (ids.has(e.id) || edgeIds.has(e.id)) E(`${w}: id "${e.id}" is already used by a node or another edge.`);
      else edgeIds.add(e.id);
    }
    const key = `${e.from}>${e.to}`;
    if (pairs.has(key)) {
      if (e.id === undefined || pairs.get(key) === undefined) E(`${w}: there are two edges from "${e.from}" to "${e.to}". Give both an "id" so tracer steps can tell them apart.`);
    }
    pairs.set(key, e.id);
  });
  if (!ok) return false;
  // groups: every group's box must hold only its own nodes, and groups must not overlap
  const L = layoutGrid(d);
  const groups = groupBoxes(d, L);
  for (const g of groups) {
    for (const n of d.nodes) {
      if (n.group === g.label) continue;
      if (rectsOverlap(g, nodeRect(L, n), 0)) E(`group "${g.label}" would draw its box around "${n.id}", which is not in the group. Move "${n.id}" outside the group's rows and columns, or add it to the group.`);
    }
  }
  for (let i = 0; i < groups.length; i++) for (let j = i + 1; j < groups.length; j++) if (rectsOverlap(groups[i], groups[j], 0)) E(`groups "${groups[i].label}" and "${groups[j].label}" overlap. Keep each group's nodes in their own block of rows and columns.`);
  return ok;
}

// A tracer step's "arch" state.
const STATE_KEYS = ['active', 'mark', 'fail', 'dim', 'hide', 'notes'];
export function validateArchState(s, d, where, rep, off) {
  if (!s || typeof s !== 'object' || Array.isArray(s)) return rep.error(`${where} must be an object like {"active": ["app", ["app", "db"]]}.`, off);
  for (const k of Object.keys(s)) if (!STATE_KEYS.includes(k)) rep.error(`${where}: unknown key "${k}". Allowed: ${STATE_KEYS.join(', ')}.`, off);
  const nodeIds = new Set(d.nodes.map((n) => n.id));
  for (const k of STATE_KEYS.slice(0, 5)) {
    if (s[k] === undefined) continue;
    if (!Array.isArray(s[k])) { rep.error(`${where}.${k} must be a list of node ids and edges ([from, to]).`, off); continue; }
    for (const ref of s[k]) {
      const r = resolveRef(d, ref);
      if (!r) rep.error(`${where}.${k}: ${JSON.stringify(ref)} is not a node id, an edge id, or an edge [from, to] in the diagram.`, off);
    }
  }
  if (s.notes !== undefined) {
    if (!s.notes || typeof s.notes !== 'object' || Array.isArray(s.notes)) rep.error(`${where}.notes must be an object like {"cache": "miss"}.`, off);
    else for (const [k, v] of Object.entries(s.notes)) {
      if (!nodeIds.has(k)) rep.error(`${where}.notes: "${k}" is not a node id.`, off);
      if (typeof v !== 'string' || !v.trim() || v.length > 16) rep.error(`${where}.notes.${k} must be a short tag, at most 16 characters (like "miss" or "v2 stored").`, off);
    }
  }
}

// node id string -> {node}; edge id string -> {edge}; [from, to] -> {edge, back}
function resolveRef(d, ref) {
  if (typeof ref === 'string') {
    const n = d.nodes.find((x) => x.id === ref);
    if (n) return { node: n.id };
    const e = d.edges.findIndex((x) => x.id === ref);
    if (e >= 0) return { edge: e, back: false };
    return null;
  }
  if (Array.isArray(ref) && ref.length === 2) {
    let e = d.edges.findIndex((x) => x.from === ref[0] && x.to === ref[1]);
    if (e >= 0) return { edge: e, back: false };
    e = d.edges.findIndex((x) => x.from === ref[1] && x.to === ref[0]);
    if (e >= 0) return { edge: e, back: true };
  }
  return null;
}

/* ---------------------------------------------------------------------- */
/* geometry helpers                                                        */
/* ---------------------------------------------------------------------- */
function rectsOverlap(a, b, pad = 0) {
  return a.x < b.x + b.w + pad && b.x < a.x + a.w + pad && a.y < b.y + b.h + pad && b.y < a.y + a.h + pad;
}
function segHitsRect(p, q, r, pad = 0) {
  // axis-aligned segment vs rectangle
  const x1 = Math.min(p.x, q.x), x2 = Math.max(p.x, q.x), y1 = Math.min(p.y, q.y), y2 = Math.max(p.y, q.y);
  return x1 < r.x + r.w + pad && x2 > r.x - pad && y1 < r.y + r.h + pad && y2 > r.y - pad;
}
function segHitsBox(p, q, b) { return segHitsRect(p, q, b, 0); }

/* ---------------------------------------------------------------------- */
/* layout                                                                  */
/* ---------------------------------------------------------------------- */
function labelSize(text) { return { w: Math.round(text.length * CH_EDGE + 12), h: 18 }; }

// Column/row positions. Gaps widen to fit labels on short straight edges.
function layoutGrid(d) {
  const maxCol = Math.max(...d.nodes.map((n) => n.col));
  const maxRow = Math.max(...d.nodes.map((n) => n.row));
  const colGap = Array(maxCol + 1).fill(COL_GAP);
  const rowGap = Array(maxRow + 1).fill(ROW_GAP);
  const byId = new Map(d.nodes.map((n) => [n.id, n]));
  for (const e of d.edges || []) {
    if (!e.label) continue;
    const a = byId.get(e.from), b = byId.get(e.to);
    if (!a || !b) continue;
    const { w, h } = labelSize(e.label);
    if (a.row === b.row && Math.abs(a.col - b.col) === 1) colGap[Math.min(a.col, b.col)] = Math.max(colGap[Math.min(a.col, b.col)], w + 28);
    if (a.col === b.col && Math.abs(a.row - b.row) === 1) rowGap[Math.min(a.row, b.row)] = Math.max(rowGap[Math.min(a.row, b.row)], h + 30);
  }
  const colX = [0];
  for (let c = 1; c <= maxCol; c++) colX[c] = colX[c - 1] + NW + colGap[c - 1];
  const rowY = [0];
  for (let r = 1; r <= maxRow; r++) rowY[r] = rowY[r - 1] + NH + rowGap[r - 1];
  return { colX, rowY, colGap, rowGap, maxCol, maxRow, byId };
}
function nodeRect(L, n) { return { x: L.colX[n.col], y: L.rowY[n.row], w: NW, h: NH }; }

// x of the vertical channel in column gap g (between col g and g+1). g = -1 is left of col 0.
function chanX(L, g) {
  if (g < 0) return L.colX[0] - 30;
  if (g >= L.maxCol) return L.colX[L.maxCol] + NW + 30;
  return L.colX[g] + NW + L.colGap[g] / 2;
}
function chanY(L, g) {
  if (g < 0) return L.rowY[0] - 30;
  if (g >= L.maxRow) return L.rowY[L.maxRow] + NH + 30;
  return L.rowY[g] + NH + L.rowGap[g] / 2;
}

function groupBoxes(d, L) {
  const by = new Map();
  for (const n of d.nodes) if (n.group) (by.get(n.group) || by.set(n.group, []).get(n.group)).push(n);
  return [...by.entries()].map(([label, ns]) => {
    const rs = ns.map((n) => ({ ...nodeRect(L, n), stack: !!n.stack }));
    const x1 = Math.min(...rs.map((r) => r.x)) - GP, y1 = Math.min(...rs.map((r) => r.y)) - GP - GL;
    const x2 = Math.max(...rs.map((r) => r.x + r.w + (r.stack ? 6 : 0))) + GP;
    const y2 = Math.max(...rs.map((r) => r.y + r.h)) + GP;
    return { label, x: x1, y: y1, w: x2 - x1, h: y2 - y1 };
  });
}

// A route: which side the edge leaves/enters, and how to build its points.
// sides: 'l' | 'r' | 't' | 'b'
function candidates(a, b, forced) {
  const dc = Math.sign(b.col - a.col), dr = Math.sign(b.row - a.row);
  const H = dc > 0 ? ['r', 'l'] : ['l', 'r'];
  const V = dr > 0 ? ['b', 't'] : ['t', 'b'];
  const c = [];
  const add = (type, sSide, tSide, chan) => c.push({ type, sSide, tSide, chan });
  const gapsH = dc > 0 ? [a.col, b.col - 1] : [a.col - 1, b.col]; // column gaps next to source, next to target
  const gapsV = dr > 0 ? [a.row, b.row - 1] : [a.row - 1, b.row];
  const want = (t) => !forced || forced === 'auto' || forced === t;
  if (dr === 0) {
    if (want('straight')) add('straight', H[0], H[1]);
    if (want('vhv')) { add('vhv', 't', 't', { axis: 'y', gap: a.row - 1 }); add('vhv', 'b', 'b', { axis: 'y', gap: a.row }); }
    if (want('hvh') && !c.length) add('straight', H[0], H[1]);
    if (!c.length) add('straight', H[0], H[1]);
    return c;
  }
  if (dc === 0) {
    if (want('straight')) add('straight', V[0], V[1]);
    if (want('hvh')) { add('hvh', 'r', 'r', { axis: 'x', gap: a.col }); add('hvh', 'l', 'l', { axis: 'x', gap: a.col - 1 }); }
    if (!c.length) add('straight', V[0], V[1]);
    return c;
  }
  const hvh = () => { add('hvh', H[0], H[1], { axis: 'x', gap: gapsH[0] }); if (gapsH[1] !== gapsH[0]) add('hvh', H[0], H[1], { axis: 'x', gap: gapsH[1] }); };
  const vhv = () => { add('vhv', V[0], V[1], { axis: 'y', gap: gapsV[0] }); if (gapsV[1] !== gapsV[0]) add('vhv', V[0], V[1], { axis: 'y', gap: gapsV[1] }); };
  const hv = () => add('hv', H[0], V[1]);
  const vh = () => add('vh', V[0], H[1]);
  const order = Math.abs(b.col - a.col) >= Math.abs(b.row - a.row) ? [hvh, vh, hv, vhv] : [vhv, hv, vh, hvh];
  const map = { hvh, vhv, hv, vh };
  if (forced && forced !== 'auto' && map[forced]) map[forced]();
  else order.forEach((f) => f());
  if (!c.length) order.forEach((f) => f());
  return c;
}

function portPoint(r, side, k, n) {
  const f = (k + 1) / (n + 1);
  if (side === 'l') return { x: r.x, y: r.y + r.h * f };
  if (side === 'r') return { x: r.x + r.w, y: r.y + r.h * f };
  if (side === 't') return { x: r.x + r.w * f, y: r.y };
  return { x: r.x + r.w * f, y: r.y + r.h };
}

function buildPoints(route, p, q, L, laneOffset = 0) {
  switch (route.type) {
    case 'straight':
      if (route.sSide === 'l' || route.sSide === 'r') {
        if (Math.abs(p.y - q.y) < 1.5) return [p, { x: q.x, y: p.y }];
        const mx = (p.x + q.x) / 2 + laneOffset;
        return [p, { x: mx, y: p.y }, { x: mx, y: q.y }, q];
      }
      if (Math.abs(p.x - q.x) < 1.5) return [p, { x: p.x, y: q.y }];
      { const my = (p.y + q.y) / 2 + laneOffset; return [p, { x: p.x, y: my }, { x: q.x, y: my }, q]; }
    case 'hvh': { const x = chanX(L, route.chan.gap) + laneOffset; return [p, { x, y: p.y }, { x, y: q.y }, q]; }
    case 'vhv': { const y = chanY(L, route.chan.gap) + laneOffset; return [p, { x: p.x, y }, { x: q.x, y }, q]; }
    case 'hv': return [p, { x: q.x, y: p.y }, q];
    case 'vh': return [p, { x: p.x, y: q.y }, q];
  }
  return [p, q];
}

function crossings(pts, rects, skip) {
  const hit = [];
  for (let i = 0; i < pts.length - 1; i++) for (const [id, r] of rects) if (!skip.includes(id) && segHitsRect(pts[i], pts[i + 1], r, 6) && !hit.includes(id)) hit.push(id);
  return hit;
}

/**
 * Lay out a validated diagram. Returns geometry for render, and warnings
 * (strings) about edges that cross nodes or labels that could not be placed.
 */
export function layoutArch(d) {
  const warnings = [];
  const L = layoutGrid(d);
  const rects = new Map(d.nodes.map((n) => [n.id, nodeRect(L, n)]));
  const groups = groupBoxes(d, L);

  // 1. pick a route per edge, avoiding other nodes
  const routes = d.edges.map((e) => {
    const a = L.byId.get(e.from), b = L.byId.get(e.to);
    const ra = rects.get(e.from), rb = rects.get(e.to);
    const cands = candidates(a, b, e.route);
    let best = null;
    for (const c of cands) {
      const pts = buildPoints(c, portPoint(ra, c.sSide, 0, 1), portPoint(rb, c.tSide, 0, 1), L);
      const hit = crossings(pts, rects, [e.from, e.to]);
      if (!hit.length) { best = c; break; }
      if (!best) best = { ...c, hit };
    }
    if (best.hit) warnings.push(`edge ${e.from} → ${e.to} passes through node "${best.hit[0]}". Move nodes so the path is clear, or set "route" (${ROUTES.slice(1).join(', ')}).`);
    return best;
  });

  // 2. spread several edges that share one side of a node
  const sideUse = new Map(); // "node:side" -> [{edge index, end: 's'|'t', key}]
  routes.forEach((r, i) => {
    const e = d.edges[i];
    const other = (id) => { const o = rects.get(id); return { x: o.x + o.w / 2, y: o.y + o.h / 2 }; };
    for (const [end, id, side, far] of [['s', e.from, r.sSide, e.to], ['t', e.to, r.tSide, e.from]]) {
      const k = `${id}:${side}`;
      const o = other(far);
      // sort key: the far end's position along this side; for channel routes, the channel matters
      const key = side === 'l' || side === 'r' ? o.y : o.x;
      (sideUse.get(k) || sideUse.set(k, []).get(k)).push({ i, end, key });
    }
  });
  // Each edge would like to leave at the far end's height (or x), so straight
  // lines stay straight; if those spots are too close, spread evenly instead.
  const ports = d.edges.map(() => ({}));
  for (const [k, list] of sideUse) {
    const [id, side] = k.split(':');
    const r = rects.get(id);
    list.sort((p, q) => p.key - q.key || p.i - q.i || (p.end < q.end ? -1 : 1));
    const horiz = side === 'l' || side === 'r';
    const lo = horiz ? r.y + 10 : r.x + 16, hi = horiz ? r.y + r.h - 10 : r.x + r.w - 16;
    const want = list.map((u) => Math.min(hi, Math.max(lo, u.key)));
    const spaced = want.every((v, j) => j === 0 || v - want[j - 1] >= 12);
    const stacked = !!L.byId.get(id).stack; // copies drawn up and to the right
    list.forEach((u, idx) => {
      const pt = spaced ? (horiz ? { x: side === 'l' ? r.x : r.x + r.w, y: want[idx] } : { x: want[idx], y: side === 't' ? r.y : r.y + r.h }) : portPoint(r, side, idx, list.length);
      if (stacked && side === 'r') pt.x += 6;
      if (stacked && side === 't') pt.y -= 6;
      ports[u.i][u.end] = pt;
    });
  }

  // 3. parallel lines in the same gap get their own lane
  const chans = new Map();
  routes.forEach((r, i) => {
    let axis, gap, lo, hi;
    const p = ports[i].s, q = ports[i].t;
    if (r.chan) { axis = r.chan.axis; gap = r.chan.gap; }
    else if (r.type === 'straight' && (r.sSide === 'l' || r.sSide === 'r') && Math.abs(p.y - q.y) >= 1.5) { axis = 'x'; gap = `s${Math.min(p.x, q.x)}`; }
    else if (r.type === 'straight' && (r.sSide === 't' || r.sSide === 'b') && Math.abs(p.x - q.x) >= 1.5) { axis = 'y'; gap = `s${Math.min(p.y, q.y)}`; }
    else return;
    if (axis === 'x') { lo = Math.min(p.y, q.y); hi = Math.max(p.y, q.y); } else { lo = Math.min(p.x, q.x); hi = Math.max(p.x, q.x); }
    const e = d.edges[i];
    const k = `${axis}${gap}`;
    (chans.get(k) || chans.set(k, []).get(k)).push({ i, lo, hi, sNet: `${e.from}:${r.sSide}`, tNet: `${e.to}:${r.tSide}` });
  });
  const laneOf = new Map();
  for (const list of chans.values()) {
    list.sort((a, b) => a.lo - b.lo || a.i - b.i);
    const lanes = [];
    for (const seg of list) {
      let k = 0;
      for (; k < lanes.length; k++) if (lanes[k].every((o) => o.sNet === seg.sNet || o.tNet === seg.tNet || seg.lo > o.hi + 8 || o.lo > seg.hi + 8)) break;
      (lanes[k] = lanes[k] || []).push(seg);
      seg.lane = k;
    }
    for (const seg of list) laneOf.set(seg.i, (seg.lane - (lanes.length - 1) / 2) * LANE);
  }

  // 4. final points
  const paths = routes.map((r, i) => buildPoints(r, ports[i].s, ports[i].t, L, laneOf.get(i) || 0));

  // 5. labels (stacked nodes draw copies up and to the right; keep labels off them)
  const bodyRects = d.nodes.map((n) => { const r = rects.get(n.id); return n.stack ? { x: r.x, y: r.y - 6, w: r.w + 6, h: r.h + 6 } : r; });
  const placed = [];
  const groupLabels = groups.map((g) => ({ x: g.x, y: g.y, w: Math.min(g.w, g.label.length * 6.6 + 20), h: GL + 4 }));
  const gapCenters = [];
  for (let r = 0; r < L.maxRow; r++) gapCenters.push(L.rowY[r] + NH + L.rowGap[r] / 2);
  const labels = d.edges.map((e, i) => {
    if (!e.label) return null;
    const { w, h } = labelSize(e.label);
    const pts = paths[i];
    const cands = [];
    for (let s = 0; s < pts.length - 1; s++) {
      const p = pts[s], q = pts[s + 1];
      const len = Math.hypot(q.x - p.x, q.y - p.y);
      if (p.y === q.y || Math.abs(p.y - q.y) < 0.5) {
        if (len >= w + 24) cands.push({ cx: (p.x + q.x) / 2, cy: p.y, pref: 0, len });
      } else {
        const y1 = Math.min(p.y, q.y) + h / 2 + 4, y2 = Math.max(p.y, q.y) - h / 2 - 4;
        for (const gy of gapCenters) if (gy >= y1 && gy <= y2) cands.push({ cx: p.x, cy: gy, pref: 1, len });
        if (len >= h + 12) cands.push({ cx: p.x, cy: (p.y + q.y) / 2, pref: 2, len });
      }
    }
    if (!cands.length) { const p = pts[0], q = pts[pts.length - 1]; cands.push({ cx: (p.x + q.x) / 2, cy: (p.y + q.y) / 2, pref: 3, len: 0 }); }
    let best = null;
    for (const c of cands) {
      const box = { x: c.cx - w / 2, y: c.cy - h / 2, w, h };
      let score = c.pref * 3 - Math.min(c.len, 400) / 400;
      for (const r of bodyRects) if (rectsOverlap(box, r, 3)) score += 100;
      for (const o of placed) if (rectsOverlap(box, o, 3)) score += 100;
      for (const g of groupLabels) if (rectsOverlap(box, g, 2)) score += 40;
      paths.forEach((pp, j) => { if (j !== i) for (let s = 0; s < pp.length - 1; s++) if (segHitsBox(pp[s], pp[s + 1], box)) score += 8; });
      if (!best || score < best.score) best = { ...c, box, score };
    }
    if (best.score >= 100) warnings.push(`the label "${e.label}" on edge ${e.from} → ${e.to} has no free spot and overlaps a node or another label. Shorten it or spread the nodes out.`);
    placed.push(best.box);
    return { text: e.label, x: best.cx, y: best.cy, box: best.box };
  });

  // 6. bounds
  const xs = [], ys = [];
  const take = (x1, y1, x2, y2) => { xs.push(x1, x2); ys.push(y1, y2); };
  for (const n of d.nodes) { const r = rects.get(n.id); take(r.x, r.y - 15, r.x + r.w + (n.stack ? 6 : 0) + 6, r.y + r.h); }
  for (const g of groups) take(g.x, g.y, g.x + g.w, g.y + g.h);
  for (const pp of paths) for (const p of pp) take(p.x - 6, p.y - 6, p.x + 6, p.y + 6);
  for (const l of labels) if (l) take(l.box.x, l.box.y, l.box.x + l.box.w, l.box.y + l.box.h);
  const pad = 6;
  const minX = Math.floor(Math.min(...xs) - pad), minY = Math.floor(Math.min(...ys) - pad);
  const W = Math.ceil(Math.max(...xs) + pad - minX), Ht = Math.ceil(Math.max(...ys) + pad - minY);
  return { d, rects, groups, paths, labels, viewBox: [minX, minY, W, Ht], warnings };
}

/* ---------------------------------------------------------------------- */
/* render                                                                  */
/* ---------------------------------------------------------------------- */
const f1 = (n) => (Math.round(n * 10) / 10).toString();

function roundedPath(pts, r = 8) {
  let d = `M${f1(pts[0].x)} ${f1(pts[0].y)}`;
  for (let i = 1; i < pts.length - 1; i++) {
    const a = pts[i - 1], b = pts[i], c = pts[i + 1];
    const l1 = Math.hypot(b.x - a.x, b.y - a.y), l2 = Math.hypot(c.x - b.x, c.y - b.y);
    const rr = Math.min(r, l1 / 2, l2 / 2);
    if (rr < 0.5) { d += ` L${f1(b.x)} ${f1(b.y)}`; continue; }
    const p1 = { x: b.x - ((b.x - a.x) / l1) * rr, y: b.y - ((b.y - a.y) / l1) * rr };
    const p2 = { x: b.x + ((c.x - b.x) / l2) * rr, y: b.y + ((c.y - b.y) / l2) * rr };
    d += ` L${f1(p1.x)} ${f1(p1.y)} Q${f1(b.x)} ${f1(b.y)} ${f1(p2.x)} ${f1(p2.y)}`;
  }
  const z = pts[pts.length - 1];
  return d + ` L${f1(z.x)} ${f1(z.y)}`;
}

// Text description of the diagram for screen readers.
export function describeArch(d) {
  const name = (id) => d.nodes.find((n) => n.id === id).label;
  const parts = d.edges.map((e) => `${name(e.from)} ${e.arrow === 'both' ? 'and' : 'to'} ${name(e.to)}${e.label ? ` (${e.label})` : ''}${e.style === 'async' ? ', asynchronous' : ''}`);
  const lonely = d.nodes.filter((n) => !d.edges.some((e) => e.from === n.id || e.to === n.id)).map((n) => n.label);
  return `${parts.join('; ')}${lonely.length ? `${parts.length ? '. ' : ''}Also: ${lonely.join(', ')}` : ''}.`;
}

/**
 * state (optional, from a tracer step): { active, mark, fail, dim, hide, notes }
 * opts: { uid (unique per svg in the page), title }
 */
export function renderArchSvg(lay, state, { uid, title = '' } = {}) {
  const { d, rects, groups, paths, labels } = lay;
  const [vx, vy, vw, vh] = lay.viewBox;
  const nodeCls = new Map(), edgeCls = new Map();
  const addCls = (map, k, c) => map.set(k, [...(map.get(k) || []), c]);
  if (state) {
    for (const [key, cls] of [['active', 'is-active'], ['mark', 'is-mark'], ['fail', 'is-fail'], ['dim', 'is-dim'], ['hide', 'is-hidden']]) {
      for (const ref of state[key] || []) {
        const r = resolveRef(d, ref);
        if (!r) continue;
        if (r.node) addCls(nodeCls, r.node, cls);
        else { addCls(edgeCls, r.edge, cls); if (r.back && key === 'active') addCls(edgeCls, r.edge, 'is-back'); }
      }
    }
  }
  // edges to a dimmed or hidden node follow it, unless the step highlights them
  if (state) d.edges.forEach((e, i) => {
    const c = edgeCls.get(i) || [];
    if (c.some((x) => x !== 'is-back')) return;
    const ends = [nodeCls.get(e.from) || [], nodeCls.get(e.to) || []];
    if (ends.some((x) => x.includes('is-hidden'))) addCls(edgeCls, i, 'is-hidden');
    else if (ends.some((x) => x.includes('is-dim'))) addCls(edgeCls, i, 'is-dim');
  });
  const notes = (state && state.notes) || {};
  const marker = (suffix) => `<marker id="${uid}-${suffix}" viewBox="0 0 10 10" refX="9.5" refY="5" markerWidth="9" markerHeight="9" markerUnits="userSpaceOnUse" orient="auto-start-reverse"><path d="M0 0.8 10 5 0 9.2z" class="ar-ah ar-ah--${suffix}"/></marker>`;
  const defs = `<defs>${['n', 'on', 'ok', 'bad'].map(marker).join('')}</defs>`;
  const gHtml = groups.map((g) => `<g class="ar-group"><rect x="${f1(g.x)}" y="${f1(g.y)}" width="${f1(g.w)}" height="${f1(g.h)}" rx="12"/><text x="${f1(g.x + 10)}" y="${f1(g.y + 14)}">${esc(g.label)}</text></g>`).join('');
  const eHtml = d.edges
    .map((e, i) => {
      const cls = ['ar-edge', e.style === 'async' ? 'ar-edge--async' : 'ar-edge--sync', ...(edgeCls.get(i) || [])];
      const st = cls.includes('is-fail') ? 'bad' : cls.includes('is-active') ? 'on' : cls.includes('is-mark') ? 'ok' : 'n';
      const arrow = e.arrow || 'end';
      const m = `${arrow !== 'none' ? ` marker-end="url(#${uid}-${st})"` : ''}${arrow === 'both' ? ` marker-start="url(#${uid}-${st})"` : ''}`;
      return `<path class="${cls.join(' ')}" data-edge="${i}" d="${roundedPath(paths[i])}"${m}/>`;
    })
    .join('');
  const lHtml = labels
    .map((l, i) => (l ? `<g class="ar-elabel${(edgeCls.get(i) || []).map((c) => ' ' + c).join('')}"><rect x="${f1(l.box.x + 2)}" y="${f1(l.box.y + 1)}" width="${f1(l.box.w - 4)}" height="${f1(l.box.h - 2)}" rx="4"/><text x="${f1(l.x)}" y="${f1(l.y)}" dy="0.35em" text-anchor="middle">${esc(l.text)}</text></g>` : ''))
    .join('');
  const nHtml = d.nodes
    .map((n) => {
      const r = rects.get(n.id);
      const k = ARCH_KINDS[n.kind];
      const cls = ['ar-node', `ar-f-${k.family}`, `ar-k-${n.kind}`, ...(nodeCls.get(n.id) || [])];
      const lines = wrapLabel(n.label);
      const cx = r.x + r.w / 2;
      const iconY = lines.length > 1 ? r.y + 7 : r.y + 10;
      const ty = lines.length > 1 ? [r.y + 38, r.y + 53] : [r.y + 47];
      let s = `<g class="${cls.join(' ')}" data-node="${esc(n.id)}">`;
      if (n.stack) s += `<rect class="ar-box ar-box--back" x="${r.x + 6}" y="${r.y - 6}" width="${r.w}" height="${r.h}" rx="10"/><rect class="ar-box ar-box--back" x="${r.x + 3}" y="${r.y - 3}" width="${r.w}" height="${r.h}" rx="10"/>`;
      s += `<rect class="ar-box" x="${r.x}" y="${r.y}" width="${r.w}" height="${r.h}" rx="10"/>`;
      s += `<g class="ar-icon" transform="translate(${f1(cx - 9)} ${f1(iconY)}) scale(0.75)">${k.icon}</g>`;
      s += lines.map((t, j) => `<text class="ar-label" x="${f1(cx)}" y="${f1(ty[j])}" text-anchor="middle">${esc(t)}</text>`).join('');
      const note = notes[n.id] ?? (cls.includes('is-fail') ? 'down' : null);
      if (note) {
        const w = note.length * 6.6 + 14;
        const nx = r.x + r.w - w + 6, ny = r.y - 13;
        s += `<g class="ar-note"><rect x="${f1(nx)}" y="${f1(ny)}" width="${f1(w)}" height="19" rx="9.5"/><text x="${f1(nx + w / 2)}" y="${f1(ny + 9.5)}" dy="0.35em" text-anchor="middle">${esc(note)}</text></g>`;
      }
      return s + '</g>';
    })
    .join('');
  const t = title || d.title || 'Architecture diagram';
  return `<svg class="ar-svg" viewBox="${vx} ${vy} ${vw} ${vh}" width="${vw}" height="${vh}" role="img" aria-labelledby="${uid}-t ${uid}-d"><title id="${uid}-t">${esc(t)}</title><desc id="${uid}-d">${esc(describeArch(d))}</desc>${defs}${gHtml}${eHtml}${nHtml}${lHtml}</svg>`;
}

// The scroll box every diagram sits in. --ar-w is the natural width: the
// diagram shrinks to fit narrow columns down to a readable size, then scrolls.
export function archBox(svg, width) {
  return `<div class="ar-scroll" style="--ar-w:${width}px" data-ar-scroll>${svg}</div>`;
}

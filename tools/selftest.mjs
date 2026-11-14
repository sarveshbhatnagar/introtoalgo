#!/usr/bin/env node
// Self-test for the problem harness and validator. Writes only to os.tmpdir().
//   node tools/selftest.mjs
// Covers every harness feature in both languages: exact, unordered, approx,
// checker, ListNode, ListNode[], TreeNode in/out, in-place (mutates), design
// classes, timeouts, and the validator's negative cases.
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { loadCurriculum } from './lib/util.mjs';
import { checkProblemFile, judge, normalizeProblem } from './lib/problems.mjs';

const cur = loadCurriculum();
const dir = mkdtempSync(join(tmpdir(), 'ia-selftest-'));
let failed = 0;

function base(slug, over) {
  return {
    slug, title: 'Fixture ' + slug, topic: 'arrays-hashing', difficulty: 'easy', pattern: 'fixture', order: 99,
    story: '<p>Fixture.</p>', task: '<p>Fixture.</p>', constraints: ['n/a'],
    hints: ['one', 'two', 'three'], bruteForce: '<p>n/a</p>', related: ['arrays'], compare: 'exact',
    solution: { walkthrough: 'w', time: 'O(n)', timeWhy: 'w', space: 'O(1)', spaceWhy: 'w', takeaway: 't' },
    ...over,
    solution: { walkthrough: 'w', time: 'O(n)', timeWhy: 'w', space: 'O(1)', spaceWhy: 'w', takeaway: 't', ...(over.solution || {}) },
  };
}
const ex = (t) => ({ ...t, explanation: 'because' });

function expect(name, p, wantErrors) {
  const file = join(dir, p.slug + '.json');
  writeFileSync(file, JSON.stringify(p));
  const r = checkProblemFile(file, cur, { run: true });
  const ok = wantErrors ? r.errors.some((e) => wantErrors.test(e.msg)) : r.errors.length === 0;
  if (!ok) failed++;
  console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}`);
  if (!ok) for (const e of r.errors) console.log('     ' + e.msg);
}

// 1. in place (mutates) + exact
const revTests = [[[1, 2, 3]], [[1]], [[]], [[2, 1]], [[5, 4, 3, 2, 1]], [[0, 0, 1]], [[9, 8]], [[1, 2, 3, 4]], [[7, 7, 7]]].map((a) => ({ args: a, expected: [...a[0]].reverse() }));
const rev = base('fx-reverse', {
  signature: { function: 'reverseInPlace', params: [{ name: 'nums', type: 'int[]' }], returns: 'void' }, mutates: 'nums',
  examples: [ex(revTests[0])], tests: revTests.slice(1),
  starter: { js: 'function reverseInPlace(nums) {\n}', py: 'def reverse_in_place(nums):\n    pass' },
  solution: { js: 'function reverseInPlace(nums) { nums.reverse(); }', py: 'def reverse_in_place(nums):\n    nums.reverse()' },
});
expect('in-place mutation', rev);

// 2. checker: any index of a peak
const peakArgs = [[1, 3, 2], [1, 2, 3], [3, 2, 1], [1, 3, 1, 3, 1], [5], [1, 2], [2, 1], [1, 5, 2, 6, 3], [4, 9, 4]];
const peak = base('fx-peak', {
  signature: { function: 'anyPeak', params: [{ name: 'nums', type: 'int[]' }], returns: 'int' }, compare: 'checker',
  checker: ['function check(args, got) {', '  const a = args[0];', '  if (!Number.isInteger(got) || got < 0 || got >= a.length) return "index out of range";', '  const l = got === 0 ? -Infinity : a[got - 1], r = got === a.length - 1 ? -Infinity : a[got + 1];', '  return a[got] > l && a[got] > r ? true : "not a peak";', '}'],
  examples: [ex({ args: [peakArgs[0]], expected: 1 })],
  tests: peakArgs.slice(1).map((a) => ({ args: [a], expected: a.indexOf(Math.max(...a)) })),
  starter: { js: 'function anyPeak(nums) {\n  return -1;\n}', py: 'def any_peak(nums):\n    return -1' },
  solution: { js: 'function anyPeak(nums) {\n  for (let i = nums.length - 1; i > 0; i--) if (nums[i] > nums[i-1] && (i === nums.length - 1 || nums[i] > nums[i+1])) return i;\n  return 0;\n}', py: 'def any_peak(nums):\n    for i in range(len(nums) - 1, 0, -1):\n        if nums[i] > nums[i-1] and (i == len(nums) - 1 or nums[i] > nums[i+1]):\n            return i\n    return 0' },
});
expect('checker (multiple valid answers)', peak);

// 3. TreeNode in and out (mirror)
const mirror = (t) => {
  // level-order mirror via the harness itself would be circular; hand-written cases instead
  return t;
};
const treeCases = [
  [[1, 2, 3], [1, 3, 2]], [[], []], [[1], [1]], [[1, 2], [1, null, 2]], [[1, null, 2], [1, 2]],
  [[4, 2, 7, 1, 3, 6, 9], [4, 7, 2, 9, 6, 3, 1]], [[2, 1, 3, null, 4], [2, 3, 1, null, null, 4]], [[5, 4, null, 3], [5, null, 4, null, 3]], [[1, 2, 3, 4, 5], [1, 3, 2, null, null, 5, 4]],
];
void mirror;
const inv = base('fx-mirror', {
  topic: 'trees', related: ['binary-trees'],
  signature: { function: 'mirrorTree', params: [{ name: 'root', type: 'TreeNode' }], returns: 'TreeNode' },
  examples: [ex({ args: [treeCases[0][0]], expected: treeCases[0][1] })],
  tests: treeCases.slice(1).map(([a, b]) => ({ args: [a], expected: b })),
  starter: { js: 'function mirrorTree(root) {\n  return root;\n}', py: 'def mirror_tree(root):\n    return root' },
  solution: { js: 'function mirrorTree(root) {\n  if (!root) return null;\n  [root.left, root.right] = [mirrorTree(root.right), mirrorTree(root.left)];\n  return root;\n}', py: 'def mirror_tree(root):\n    if root is None:\n        return None\n    root.left, root.right = mirror_tree(root.right), mirror_tree(root.left)\n    return root' },
});
expect('TreeNode in and out', inv);

// 4. ListNode[] in, ListNode out
const lists = [[[[1, 4], [2, 3]], [1, 2, 3, 4]], [[[]], []], [[], []], [[[1], [1]], [1, 1]], [[[5]], [5]], [[[1, 2], [], [0]], [0, 1, 2]], [[[2, 6], [1, 9], [3]], [1, 2, 3, 6, 9]], [[[-1, 0], [-2]], [-2, -1, 0]], [[[7, 8, 9], [1]], [1, 7, 8, 9]]];
const mergeK = base('fx-mergek', {
  topic: 'linked-lists-stacks-queues', related: ['linked-lists'],
  signature: { function: 'mergeAll', params: [{ name: 'lists', type: 'ListNode[]' }], returns: 'ListNode' },
  examples: [ex({ args: [lists[0][0]], expected: lists[0][1] })],
  tests: lists.slice(1).map(([a, b]) => ({ args: [a], expected: b })),
  starter: { js: 'function mergeAll(lists) {\n  return null;\n}', py: 'def merge_all(lists):\n    return None' },
  solution: {
    js: 'function mergeAll(lists) {\n  const vals = [];\n  for (let n of lists) for (; n; n = n.next) vals.push(n.val);\n  vals.sort((a, b) => a - b);\n  let head = null;\n  for (let i = vals.length - 1; i >= 0; i--) head = new ListNode(vals[i], head);\n  return head;\n}',
    py: 'def merge_all(lists):\n    vals = []\n    for n in lists:\n        while n:\n            vals.append(n.val)\n            n = n.next\n    head = None\n    for v in sorted(vals, reverse=True):\n        head = ListNode(v, head)\n    return head',
  },
});
expect('ListNode[] in, ListNode out', mergeK);

// 5. design class
const ops = (pings) => ({ ops: ['HitLog', ...pings.map(() => 'hit'), 'count'], args: [[3], ...pings.map((t) => [t]), [pings[pings.length - 1]]] });
const designCases = [[1, 2, 3, 4], [1], [1, 5, 9], [2, 2, 2], [1, 2, 10], [5, 6, 7, 8, 9], [100], [1, 3, 4, 6], [1, 4]];
const hitlog = base('fx-hitlog', {
  topic: 'heaps-tries-bits', related: ['designing-data-structures'],
  signature: { class: 'HitLog', init: { params: [{ name: 'window', type: 'int' }] }, methods: [{ name: 'hit', params: [{ name: 't', type: 'int' }], returns: 'void' }, { name: 'count', params: [{ name: 't', type: 'int' }], returns: 'int' }] },
  examples: [ex({ ...ops(designCases[0]), expected: [null, null, null, null, null, 3] })],
  tests: designCases.slice(1).map((p) => {
    const t = ops(p);
    const last = p[p.length - 1];
    return { ...t, expected: [null, ...p.map(() => null), p.filter((x) => x > last - 3).length] };
  }),
  starter: { js: 'class HitLog {\n  constructor(window) {}\n  hit(t) {}\n  count(t) { return 0; }\n}', py: 'class HitLog:\n    def __init__(self, window):\n        pass\n    def hit(self, t):\n        pass\n    def count(self, t):\n        return 0' },
  solution: {
    js: 'class HitLog {\n  constructor(window) { this.w = window; this.q = []; }\n  hit(t) { this.q.push(t); }\n  count(t) { while (this.q.length && this.q[0] <= t - this.w) this.q.shift(); return this.q.length; }\n}',
    py: 'from collections import deque\nclass HitLog:\n    def __init__(self, window):\n        self.w = window\n        self.q = deque()\n    def hit(self, t):\n        self.q.append(t)\n    def count(self, t):\n        while self.q and self.q[0] <= t - self.w:\n            self.q.popleft()\n        return len(self.q)',
  },
});
expect('design class', hitlog);

// 6. approx
const avg = base('fx-avg', {
  signature: { function: 'mean', params: [{ name: 'xs', type: 'float[]' }], returns: 'float' }, compare: 'approx',
  examples: [ex({ args: [[1, 2]], expected: 1.5 })],
  tests: [[[0.1, 0.2]], [[1]], [[1, 1, 1]], [[2, 3, 4]], [[1e-7, 2e-7]], [[-1, 1]], [[10, 20, 30, 40]], [[1 / 3, 1 / 3, 1 / 3]]].map((a) => ({ args: a, expected: a[0].reduce((s, x) => s + x, 0) / a[0].length + 1e-9 })),
  starter: { js: 'function mean(xs) {\n  return 0;\n}', py: 'def mean(xs):\n    return 0' },
  solution: { js: 'function mean(xs) { return xs.reduce((a, b) => a + b, 0) / xs.length; }', py: 'def mean(xs):\n    return sum(xs) / len(xs)' },
});
expect('approx floats', avg);

// negative cases
expect('rejects a wrong reference solution', { ...rev, slug: 'fx-bad1', solution: { ...rev.solution, js: 'function reverseInPlace(nums) { }' } }, /JavaScript reference solution fails/);
expect('rejects a starter that already passes', { ...rev, slug: 'fx-bad2', starter: { ...rev.starter, py: rev.solution.py } }, /starter code already passes/);
expect('rejects a starter with a syntax error', { ...rev, slug: 'fx-bad3', starter: { ...rev.starter, py: 'def reverse_in_place(nums)\n    pass' } }, /does not parse/);
expect('rejects a type mismatch', { ...rev, slug: 'fx-bad4', tests: [...rev.tests.slice(1), { args: [['a']], expected: ['a'] }] }, /does not match type/);
expect('rejects unknown keys', { ...rev, slug: 'fx-bad5', hint: [] }, /Unknown key "hint"/);
expect('rejects too few hints', { ...rev, slug: 'fx-bad6', hints: ['a'] }, /3 to 5 hints/);
expect('rejects an unknown related lesson', { ...rev, slug: 'fx-bad7', related: ['nope'] }, /not in content\/curriculum.json/);
expect('rejects an infinite loop in the reference', { ...rev, slug: 'fx-bad8', solution: { ...rev.solution, py: 'def reverse_in_place(nums):\n    while True:\n        pass' } }, /Time limit/);

// error line numbers
const n = normalizeProblem(rev);
const jl = judge(n, 'js', 'function reverseInPlace(nums) {\n  const x = null;\n  x.foo();\n}');
const pl = judge(n, 'py', 'def reverse_in_place(nums):\n    x = None\n    x.foo()');
const lineOk = /line 3/.test(jl.failures[0]?.error) && /line 3/.test(pl.failures[0]?.error);
if (!lineOk) failed++;
console.log(`${lineOk ? 'ok  ' : 'FAIL'} runtime errors report the user's line number (${jl.failures[0]?.error} | ${pl.failures[0]?.error})`);

// ListNode / TreeNode output conversion agrees between JS and Python
{
  const { runJs, runPy } = await import('./lib/problems.mjs');
  const same = (name, meta, js, py, tests, want) => {
    const a = runJs(meta, js, tests).results.map((r) => (r.ok ? r.got : r.error));
    const b = runPy(meta, py, tests).results.map((r) => (r.ok ? r.got : r.error));
    const ok = JSON.stringify(a) === JSON.stringify(want) && JSON.stringify(b) === JSON.stringify(want);
    if (!ok) failed++;
    console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${ok ? '' : ` js=${JSON.stringify(a)} py=${JSON.stringify(b)}`}`);
  };
  const t = (args) => ({ args, expected: null });
  const L = { signature: { function: 'f', params: [{ name: 'h', type: 'ListNode' }], returns: 'ListNode' }, compare: 'exact' };
  same('ListNode empty/single/bare return agree', L, 'function f(h) { if (!h) return; return h; }', 'def f(h):\n    if h is None:\n        return\n    return h', [t([[]]), t([[7]]), t([[1, 2]])], [[], [7], [1, 2]]);
  const T = { signature: { function: 'f', params: [{ name: 'r', type: 'TreeNode' }], returns: 'TreeNode' }, compare: 'exact' };
  same('TreeNode empty/single/gaps agree', T, 'function f(r) { return r; }', 'def f(r):\n    return r', [t([[]]), t([[5]]), t([[1, null, 2, 3]])], [[], [5], [1, null, 2, 3]]);
  const LA = { signature: { function: 'f', params: [{ name: 'hs', type: 'ListNode[]' }], returns: 'ListNode[]' }, compare: 'exact' };
  same('ListNode[] empty elements stay []', LA, 'function f(hs) { return hs; }', 'def f(hs):\n    return hs', [t([[[], [1, 2]]])], [[[], [1, 2]]]);
  const bad = runJs(L, 'function f(h) { return [1]; }', [t([[1]])]).results[0];
  const badPy = runPy(L, 'def f(h):\n    return [1]', [t([[1]])]).results[0];
  const okBad = !bad.ok && /Return a ListNode/.test(bad.error) && !badPy.ok && /Return a ListNode/.test(badPy.error);
  if (!okBad) failed++;
  console.log(`${okBad ? 'ok  ' : 'FAIL'} returning an array for a ListNode is a clear error`);
}

// Lesson components: every component snippet in AUTHORING.md must validate,
// and the system design validators must catch common mistakes.
{
  const { readFileSync } = await import('node:fs');
  const { processLessonBody } = await import('./lib/components.mjs');
  const { CONTENT } = await import('./lib/util.mjs');
  const { layoutArch } = await import('./lib/arch.mjs');
  const guide = readFileSync(join(CONTENT, 'AUTHORING.md'), 'utf8');
  const snippets = [...guide.matchAll(/```html\n(<x-[\s\S]*?)```/g)].map((m) => m[1]);
  let bad = 0;
  for (const sn of snippets) {
    const r = processLessonBody(sn, { resolveLink: () => ({ ok: true }) });
    if (r.errors.length) { bad++; console.log('     ' + sn.split('\n')[0] + ' -> ' + r.errors.map((e) => e.msg).join('; ')); }
  }
  const okSnip = snippets.length >= 15 && !bad;
  if (!okSnip) failed++;
  console.log(`${okSnip ? 'ok  ' : 'FAIL'} all ${snippets.length} component snippets in AUTHORING.md validate`);

  const errs = (body) => processLessonBody(body, { resolveLink: () => ({ ok: true }) }).errors.map((e) => e.msg).join(' | ');
  const arch = (o) => `<x-arch caption="c"><script type="application/json">${JSON.stringify(o)}</script></x-arch>`;
  const N = (id, col, row, kind = 'service') => ({ id, label: id, kind, col, row });
  const neg = (name, body, re) => {
    const e = errs(body);
    const ok = re.test(e);
    if (!ok) failed++;
    console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${ok ? '' : ` (got: ${e || 'no errors'})`}`);
  };
  neg('x-arch rejects an unknown kind', arch({ nodes: [N('a', 0, 0, 'server'), N('b', 1, 0)], edges: [] }), /"kind" must be one of/);
  neg('x-arch rejects two nodes in one cell', arch({ nodes: [N('a', 0, 0), N('b', 0, 0)], edges: [] }), /already taken/);
  neg('x-arch rejects an edge to a missing node', arch({ nodes: [N('a', 0, 0), N('b', 1, 0)], edges: [{ from: 'a', to: 'c' }] }), /"to" must be a node id/);
  neg('x-arch rejects a label that does not fit', arch({ nodes: [{ ...N('a', 0, 0), label: 'An extremely long label that cannot possibly fit in a box' }, N('b', 1, 0)], edges: [] }), /does not fit/);
  neg('x-arch rejects a group that swallows another node', arch({ nodes: [{ ...N('a', 0, 0), group: 'G' }, N('b', 1, 0), { ...N('c', 2, 0), group: 'G' }], edges: [] }), /not in the group/);
  neg('x-arch needs a caption', '<x-arch><script type="application/json">' + JSON.stringify({ nodes: [N('a', 0, 0), N('b', 1, 0)], edges: [] }) + '</script></x-arch>', /needs a caption/);
  neg('tracer arch state rejects an unknown edge', `<x-tracer><script type="application/json">${JSON.stringify({ arch: { nodes: [N('a', 0, 0), N('b', 1, 0)], edges: [{ from: 'a', to: 'b' }] }, steps: [{ caption: 'x', arch: { active: [['a', 'z']] } }, { caption: 'y' }] })}</script></x-tracer>`, /is not a node id, an edge id, or an edge/);
  const est = (o) => `<x-estimate><script type="application/json">${JSON.stringify({ question: 'q', givens: ['g'], unit: 'bytes', answer: '3 TB', accept: ['1 TB', '10 TB'], steps: ['s'], ...o })}</script></x-estimate>`;
  neg('x-estimate rejects an answer outside its range', est({ answer: '30 TB' }), /inside the "accept" range/);
  neg('x-estimate rejects a unit from another family', est({ answer: '3 million' }), /"answer" must be a number with a bytes unit/);
  neg('x-estimate needs exactly one right choice', est({ choices: ['3 GB', '3 TB', '5 TB'] }), /exactly one choice/);
  neg('x-tradeoffs needs "pick"', `<x-tradeoffs><script type="application/json">${JSON.stringify({ options: [{ name: 'a', good: 'g', bad: 'b' }, { name: 'b', good: 'g', bad: 'b', pick: 'p' }] })}</script></x-tradeoffs>`, /"pick" is required/);
  neg('x-interview needs both roles', '<x-interview><x-you>Hi.</x-you></x-interview>', /needs at least one <x-interviewer>/);
  neg('x-checklist needs 3 items', `<x-checklist><script type="application/json">${JSON.stringify({ items: ['a', 'b'] })}</script></x-checklist>`, /Use 3 to 24/);
  neg('x-tryit rejects minutes without variant', '<x-tryit minutes="2"><x-task><p>t</p></x-task><x-answer><p>a</p></x-answer></x-tryit>', /only works with variant="turn"/);

  // case study structure: fixed headings and components are enforced
  {
    const { mkdirSync } = await import('node:fs');
    const { checkLessonFile, makeLinkResolver } = await import('./lib/lessons.mjs');
    const sdDir = join(dir, 'system-design');
    mkdirSync(sdDir, { recursive: true });
    const sample = readFileSync(join(CONTENT, 'system-design', 'design-a-url-shortener.html'), 'utf8');
    const lessonErrs = (slug, src) => {
      writeFileSync(join(sdDir, slug + '.html'), src);
      return checkLessonFile(join(sdDir, slug + '.html'), cur, makeLinkResolver(cur)).errors.map((e) => e.msg).join(' | ');
    };
    const caseOk = (name, slug, src, re) => {
      const e = lessonErrs(slug, src);
      const ok = re ? re.test(e) : e === '';
      if (!ok) failed++;
      console.log(`${ok ? 'ok  ' : 'FAIL'} ${name}${ok ? '' : ` (got: ${e || 'no errors'})`}`);
    };
    caseOk('the sample case study passes as another design slug', 'design-a-chat-app', sample, null);
    caseOk('a case study missing "Deep dives" is rejected', 'design-a-chat-app', sample.replace('<h2>Deep dives</h2>', '<h2>Hard parts</h2>'), /missing the section <h2>Deep dives<\/h2>/);
    caseOk('case study sections out of order are rejected', 'design-a-chat-app', sample.replace('<h2>Define the API</h2>', '<h2>TMP</h2>').replace('<h2>Model the data</h2>', '<h2>Define the API</h2>').replace('<h2>TMP</h2>', '<h2>Model the data</h2>'), /out of order/);
    caseOk('a case study without "Your turn" boxes is rejected', 'design-a-chat-app', sample.replace(/variant="turn" minutes="\d+" /g, ''), /variant="turn"/);
    caseOk('"kind": "design" on a concept slug is rejected', 'load-balancing', sample, /is a concept lesson/);
    caseOk('a case study slug without "kind": "design" is rejected', 'design-a-chat-app', sample.replace('"kind": "design",', ''), /Add "kind": "design"/);
  }

  // layout: a three-row fan-out routes around nodes and keeps labels apart
  const lay = layoutArch({ nodes: [N('lb', 0, 1, 'load-balancer'), N('a', 1, 0), N('b', 1, 1), N('c', 1, 2), N('db', 2, 1, 'database')], edges: [{ from: 'lb', to: 'a', label: 'one' }, { from: 'lb', to: 'b', label: 'two' }, { from: 'lb', to: 'c', label: 'three' }, { from: 'a', to: 'db' }, { from: 'b', to: 'db' }, { from: 'c', to: 'db' }] });
  const okLay = lay.warnings.length === 0;
  if (!okLay) failed++;
  console.log(`${okLay ? 'ok  ' : 'FAIL'} arch layout routes a fan-out and fan-in without crossings or label clashes${okLay ? '' : ': ' + lay.warnings.join('; ')}`);
  const blocked = layoutArch({ nodes: [N('a', 0, 0), N('b', 1, 0), N('c', 2, 0)], edges: [{ from: 'a', to: 'c', route: 'straight' }] });
  const okBlk = blocked.warnings.some((w) => /passes through node "b"/.test(w));
  if (!okBlk) failed++;
  console.log(`${okBlk ? 'ok  ' : 'FAIL'} arch layout warns when a forced route passes through a node`);
}

rmSync(dir, { recursive: true, force: true });
console.log(failed ? `\n${failed} self-test(s) failed` : '\nall self-tests passed');
process.exit(failed ? 1 : 0);

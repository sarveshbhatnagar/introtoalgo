/* ==========================================================================
   harness.js — shared test harness for practice problems.

   Loaded three ways, always the same code:
     - in the JavaScript Web Worker (importScripts)
     - on the problem page main thread (to compare results)
     - in Node by tools/check.mjs (require)

   It knows how to: convert typed arguments (ListNode, TreeNode) in and out,
   turn any value into plain JSON, compare outputs (exact, unordered, approx,
   checker), and pull a line number out of an error stack.
   ========================================================================== */
(function (root) {
  'use strict';

  var MAX_NODES = 100000;
  var EPS = 1e-6;

  function ListNode(val, next) {
    this.val = val === undefined ? 0 : val;
    this.next = next === undefined ? null : next;
  }
  function TreeNode(val, left, right) {
    this.val = val === undefined ? 0 : val;
    this.left = left === undefined ? null : left;
    this.right = right === undefined ? null : right;
  }

  /* ---------- conversions: plain arrays <-> nodes ---------- */

  function arrayToList(arr) {
    if (arr === null || arr === undefined) return null;
    var dummy = new ListNode(0), cur = dummy;
    for (var i = 0; i < arr.length; i++) { cur.next = new ListNode(arr[i]); cur = cur.next; }
    return dummy.next;
  }

  function listToArray(head) {
    var out = [], seen = 0, node = head;
    while (node !== null && node !== undefined) {
      if (++seen > MAX_NODES) throw new Error('The returned list has more than ' + MAX_NODES + ' nodes. Is there a cycle?');
      out.push(toPlain(node.val));
      node = node.next;
    }
    return out;
  }

  // Level order with nulls, like [3, 9, 20, null, null, 15, 7].
  function arrayToTree(arr) {
    if (!arr || arr.length === 0 || arr[0] === null) return null;
    var rootNode = new TreeNode(arr[0]);
    var queue = [rootNode], i = 1, head = 0;
    while (head < queue.length && i < arr.length) {
      var node = queue[head++];
      if (i < arr.length && arr[i] !== null) { node.left = new TreeNode(arr[i]); queue.push(node.left); }
      i++;
      if (i < arr.length && arr[i] !== null) { node.right = new TreeNode(arr[i]); queue.push(node.right); }
      i++;
    }
    return rootNode;
  }

  function treeToArray(rootNode) {
    if (!rootNode) return [];
    var out = [], queue = [rootNode], head = 0, seen = 0;
    while (head < queue.length) {
      var node = queue[head++];
      if (node === null || node === undefined) { out.push(null); continue; }
      if (++seen > MAX_NODES) throw new Error('The returned tree has more than ' + MAX_NODES + ' nodes. Is there a cycle?');
      out.push(toPlain(node.val));
      queue.push(node.left === undefined ? null : node.left);
      queue.push(node.right === undefined ? null : node.right);
    }
    while (out.length && out[out.length - 1] === null) out.pop();
    return out;
  }

  function baseType(type) { return String(type || 'any').replace(/\s+/g, ''); }

  // Turn a JSON test value into what the user's function receives.
  function convertIn(value, type) {
    var t = baseType(type);
    if (t === 'ListNode') return arrayToList(value);
    if (t === 'TreeNode') return arrayToTree(value);
    if (t === 'ListNode[]') return (value || []).map(arrayToList);
    if (t === 'TreeNode[]') return (value || []).map(arrayToTree);
    return clone(value);
  }

  // Turn whatever the user's function returned into plain JSON.
  // Returning null or undefined (a bare `return;`) for a ListNode/TreeNode
  // means "empty" and becomes [], the same as None in Python.
  function convertOut(value, type) {
    var t = baseType(type);
    if (t === 'ListNode' || t === 'TreeNode') {
      if (value === null || value === undefined) return [];
      if (!value || typeof value !== 'object' || !('val' in value) || Array.isArray(value)) throw new TypeError('Return a ' + t + ' (or null), not ' + describe(value) + '. Build the result from ' + t + ' objects.');
      return t === 'ListNode' ? listToArray(value) : treeToArray(value);
    }
    if ((t === 'ListNode[]' || t === 'TreeNode[]') && Array.isArray(value)) {
      var inner = t.slice(0, -2);
      return value.map(function (x) { return convertOut(x, inner); });
    }
    return toPlain(value);
  }

  function describe(v) {
    if (Array.isArray(v)) return 'an array';
    if (typeof v === 'object') return 'an object without a val field';
    return 'a ' + typeof v + ' (' + String(v).slice(0, 40) + ')';
  }

  function isListNode(v) { return v instanceof ListNode || (v && typeof v === 'object' && 'val' in v && 'next' in v && !('left' in v)); }
  function isTreeNode(v) { return v instanceof TreeNode || (v && typeof v === 'object' && 'val' in v && 'left' in v && 'right' in v); }

  function toPlain(v, depth) {
    depth = depth || 0;
    if (depth > 200) throw new Error('Value is nested too deeply to display.');
    if (v === undefined || v === null) return null;
    var t = typeof v;
    if (t === 'number') {
      if (Number.isNaN(v)) return 'NaN';
      if (v === Infinity) return 'Infinity';
      if (v === -Infinity) return '-Infinity';
      return Object.is(v, -0) ? 0 : v;
    }
    if (t === 'string' || t === 'boolean') return v;
    if (t === 'bigint') return Number(v);
    if (t === 'function') return '[function]';
    if (t === 'symbol') return String(v);
    if (Array.isArray(v) || ArrayBuffer.isView(v)) return Array.prototype.map.call(v, function (x) { return toPlain(x, depth + 1); });
    if (v instanceof Set) return Array.from(v, function (x) { return toPlain(x, depth + 1); });
    if (v instanceof Map) {
      var mo = {};
      v.forEach(function (val, key) { mo[String(key)] = toPlain(val, depth + 1); });
      return mo;
    }
    if (isTreeNode(v)) return treeToArray(v);
    if (isListNode(v)) return listToArray(v);
    var o = {};
    Object.keys(v).forEach(function (k) { o[k] = toPlain(v[k], depth + 1); });
    return o;
  }

  function clone(v) { return v === undefined ? undefined : JSON.parse(JSON.stringify(v)); }

  /* ---------- problem helpers ---------- */

  // camelCase -> snake_case, used for Python names: findPair -> find_pair
  function snake(name) {
    return String(name).replace(/([a-z0-9])([A-Z])/g, '$1_$2').replace(/([A-Z])([A-Z][a-z])/g, '$1_$2').toLowerCase();
  }

  function isDesign(sig) { return !!(sig && sig.class); }

  function entryName(sig, lang) {
    if (isDesign(sig)) return sig.class;
    return lang === 'py' ? snake(sig.function) : sig.function;
  }

  function methodSig(sig, op) {
    if (op === sig.class) return { params: (sig.init && sig.init.params) || [], returns: 'void' };
    for (var i = 0; i < sig.methods.length; i++) if (sig.methods[i].name === op) return sig.methods[i];
    return null;
  }

  /* ---------- running one test (JavaScript) ---------- */

  // entry: the user's function (or class, for design problems).
  // Returns the plain output that gets compared to test.expected.
  function runJsTest(entry, problem, test) {
    var sig = problem.signature;
    if (isDesign(sig)) {
      var ops = test.ops, argsList = test.args, outputs = [], obj = null;
      for (var i = 0; i < ops.length; i++) {
        var ms = methodSig(sig, ops[i]);
        if (!ms) throw new Error('Unknown operation "' + ops[i] + '".');
        var a = (argsList[i] || []).map(function (x, j) { return convertIn(x, ms.params[j] && ms.params[j].type); });
        if (i === 0) {
          if (typeof entry !== 'function') throw new Error('Could not find class ' + sig.class + '. Keep the class name from the starter code.');
          obj = construct(entry, a);
          outputs.push(null);
        } else {
          if (typeof obj[ops[i]] !== 'function') throw new Error('Your class has no method "' + ops[i] + '".');
          var r = obj[ops[i]].apply(obj, a);
          outputs.push(ms.returns === 'void' ? null : convertOut(r, ms.returns));
        }
      }
      return outputs;
    }
    if (typeof entry !== 'function') throw new Error('Could not find a function named ' + sig.function + '. Keep the name from the starter code.');
    var args = test.args.map(function (x, j) { return convertIn(x, sig.params[j] && sig.params[j].type); });
    var result = entry.apply(null, args);
    if (problem.mutates) {
      var idx = paramIndex(sig, problem.mutates);
      return convertOut(args[idx], sig.params[idx].type);
    }
    return convertOut(result, sig.returns);
  }

  function construct(Cls, args) {
    // Supports both `class Foo {}` and old-style constructor functions.
    return new (Function.prototype.bind.apply(Cls, [null].concat(args)))();
  }

  function paramIndex(sig, name) {
    for (var i = 0; i < sig.params.length; i++) if (sig.params[i].name === name) return i;
    return -1;
  }

  /* ---------- comparing ---------- */

  function numEq(a, b, approx) {
    if (a === b) return true;
    if (!approx) return false;
    var diff = Math.abs(a - b);
    return diff <= EPS || diff <= EPS * Math.max(Math.abs(a), Math.abs(b));
  }

  function deepEqual(a, b, approx) {
    if (typeof a === 'number' && typeof b === 'number') return numEq(a, b, approx);
    if (a === b) return true;
    if (a === null || b === null || typeof a !== 'object' || typeof b !== 'object') return false;
    if (Array.isArray(a) !== Array.isArray(b)) return false;
    if (Array.isArray(a)) {
      if (a.length !== b.length) return false;
      for (var i = 0; i < a.length; i++) if (!deepEqual(a[i], b[i], approx)) return false;
      return true;
    }
    var ka = Object.keys(a), kb = Object.keys(b);
    if (ka.length !== kb.length) return false;
    for (var j = 0; j < ka.length; j++) {
      if (!Object.prototype.hasOwnProperty.call(b, ka[j])) return false;
      if (!deepEqual(a[ka[j]], b[ka[j]], approx)) return false;
    }
    return true;
  }

  function canonical(v) {
    if (Array.isArray(v)) return '[' + v.map(canonical).join(',') + ']';
    if (v && typeof v === 'object') return '{' + Object.keys(v).sort().map(function (k) { return JSON.stringify(k) + ':' + canonical(v[k]); }).join(',') + '}';
    return JSON.stringify(v);
  }

  function sortedCopy(arr) {
    return arr.slice().sort(function (x, y) { var a = canonical(x), b = canonical(y); return a < b ? -1 : a > b ? 1 : 0; });
  }

  var checkerCache = {};
  function compileChecker(src) {
    if (checkerCache[src]) return checkerCache[src];
    var fn = new Function(src + '\n;return typeof check === "function" ? check : undefined;')();
    if (typeof fn !== 'function') throw new Error('The checker must define function check(args, got, expected).');
    checkerCache[src] = fn;
    return fn;
  }

  // Returns { pass: boolean, message?: string }
  function compare(problem, test, got) {
    var mode = problem.compare || 'exact';
    var expected = test.expected;
    if (mode === 'checker') {
      var check = compileChecker(problem.checker);
      var verdict;
      try { verdict = check(clone(test.args), clone(got), clone(expected), clone(test.ops)); }
      catch (e) { return { pass: false, message: 'Checker error: ' + (e && e.message) }; }
      if (verdict === true) return { pass: true };
      return { pass: false, message: typeof verdict === 'string' ? verdict : '' };
    }
    if (mode === 'unordered') {
      if (!Array.isArray(got)) return { pass: false, message: 'Expected a list.' };
      return { pass: deepEqual(sortedCopy(got), sortedCopy(expected), false) };
    }
    return { pass: deepEqual(got, expected, mode === 'approx') };
  }

  /* ---------- display helpers ---------- */

  function formatValue(v, max) {
    max = max || 2000;
    var s;
    try { s = JSON.stringify(v); } catch (e) { s = String(v); }
    if (s === undefined) s = 'undefined';
    s = s.replace(/,(?=[^\s])/g, ', ');
    return s.length > max ? s.slice(0, max) + ' …' : s;
  }

  function formatArgs(problem, test) {
    var sig = problem.signature;
    if (isDesign(sig)) {
      return test.ops.map(function (op, i) {
        return (i === 0 ? 'new ' : '.') + op + '(' + (test.args[i] || []).map(function (x) { return formatValue(x, 400); }).join(', ') + ')';
      }).join('\n');
    }
    return sig.params.map(function (p, i) { return p.name + ' = ' + formatValue(test.args[i], 800); }).join('\n');
  }

  // Find the user's line number in an error stack. The user's code is always
  // evaluated with the file name "solution.js".
  function errorLine(err) {
    var stack = err && err.stack ? String(err.stack) : '';
    var m = stack.match(/solution\.js:(\d+)(?::(\d+))?/);
    return m ? parseInt(m[1], 10) : null;
  }

  function errorText(err) {
    if (!err) return 'Unknown error';
    if (err instanceof RangeError && /call stack/i.test(err.message)) return 'RangeError: Maximum call stack size exceeded (infinite recursion?)';
    return (err.name ? err.name + ': ' : '') + (err.message || String(err));
  }

  function formatLogArg(x) {
    if (typeof x === 'string') return x;
    try { return formatValue(toPlain(x), 4000); } catch (e) { return String(x); }
  }

  var api = {
    ListNode: ListNode, TreeNode: TreeNode,
    arrayToList: arrayToList, listToArray: listToArray, arrayToTree: arrayToTree, treeToArray: treeToArray,
    convertIn: convertIn, convertOut: convertOut, toPlain: toPlain, clone: clone,
    snake: snake, isDesign: isDesign, entryName: entryName, methodSig: methodSig, paramIndex: paramIndex,
    runJsTest: runJsTest, compare: compare, deepEqual: deepEqual, compileChecker: compileChecker,
    formatValue: formatValue, formatArgs: formatArgs, errorLine: errorLine, errorText: errorText, formatLogArg: formatLogArg
  };

  root.IAHarness = api;
  if (typeof module === 'object' && module.exports) module.exports = api;
})(typeof self !== 'undefined' ? self : globalThis);

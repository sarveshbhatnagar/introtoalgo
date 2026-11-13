/* js-worker.js — runs the learner's JavaScript off the main thread.
   A fresh worker is created for every run and killed afterwards (or on timeout). */
importScripts('/assets/js/harness.js');
var H = self.IAHarness;
self.ListNode = H.ListNode;
self.TreeNode = H.TreeNode;

var logs = [];
function capture() {
  if (logs.length < 300) logs.push(Array.prototype.map.call(arguments, H.formatLogArg).join(' '));
  else if (logs.length === 300) logs.push('… more output was cut off');
}
['log', 'info', 'warn', 'error', 'debug'].forEach(function (k) { console[k] = capture; });

self.onmessage = function (e) {
  var msg = e.data;
  var problem = msg.problem;
  var name = H.entryName(problem.signature, 'js');
  logs = [];
  var entry;
  try {
    // Indirect eval runs in global scope; the sourceURL makes stack traces say "solution.js:LINE".
    (0, eval)(msg.code + '\n;self.__ia_entry = (typeof ' + name + ' !== "undefined") ? ' + name + ' : undefined;\n//# sourceURL=solution.js');
    entry = self.__ia_entry;
  } catch (err) {
    postMessage({ type: 'prepare', ok: false, error: H.errorText(err), line: H.errorLine(err), syntax: err instanceof SyntaxError, logs: logs.join('\n') });
    return;
  }
  postMessage({ type: 'prepare', ok: true, logs: logs.join('\n') });
  msg.tests.forEach(function (t, i) {
    logs = [];
    postMessage({ type: 'start', i: i });
    var t0 = performance.now();
    try {
      var got = H.runJsTest(entry, problem, t);
      postMessage({ type: 'result', i: i, ok: true, got: got, logs: logs.join('\n'), ms: performance.now() - t0 });
    } catch (err) {
      postMessage({ type: 'result', i: i, ok: false, error: H.errorText(err), line: H.errorLine(err), logs: logs.join('\n') });
    }
  });
  postMessage({ type: 'done' });
};

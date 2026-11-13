/* py-worker.js — runs the learner's Python with Pyodide, off the main thread.
   Module worker: current Pyodide only supports module workers.
   Pyodide (~10 MB) is loaded lazily the first time someone picks Python, then
   kept warm. On a timeout the page kills this worker and starts a new one. */
var pyodide = null;
var prepareFn = null;
var runOneFn = null;

async function boot(base) {
  const mod = await import(base + 'pyodide.mjs');
  pyodide = await mod.loadPyodide({ indexURL: base, stdout: function () {}, stderr: function () {} });
  var res = await fetch('/assets/js/runner/harness.py');
  if (!res.ok) throw new Error('Could not load harness.py (' + res.status + ')');
  pyodide.runPython(await res.text());
  prepareFn = pyodide.globals.get('prepare');
  runOneFn = pyodide.globals.get('run_one');
}

self.onmessage = async function (e) {
  var msg = e.data;
  if (msg.type === 'init') {
    try {
      await boot(msg.base);
      postMessage({ type: 'ready' });
    } catch (err) {
      postMessage({ type: 'fatal', error: String((err && err.message) || err) });
    }
    return;
  }
  if (msg.type === 'run') {
    var prep;
    try {
      prep = JSON.parse(prepareFn(msg.code, JSON.stringify(msg.problem)));
    } catch (err) {
      prep = { ok: false, error: String((err && err.message) || err) };
    }
    postMessage(Object.assign({ type: 'prepare' }, prep));
    if (!prep.ok) return;
    for (var i = 0; i < msg.tests.length; i++) {
      postMessage({ type: 'start', i: i });
      var r;
      try {
        r = JSON.parse(runOneFn(JSON.stringify(msg.tests[i])));
      } catch (err) {
        r = { ok: false, error: String((err && err.message) || err) };
      }
      postMessage(Object.assign({ type: 'result', i: i }, r));
    }
    postMessage({ type: 'done' });
  }
};

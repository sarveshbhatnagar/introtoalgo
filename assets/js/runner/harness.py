# harness.py - Python side of the practice test harness.
#
# Used in two places, always the same code:
#   - in the browser, inside Pyodide, by assets/js/runner/py-worker.js
#   - on the command line by tools/check.mjs:  python3 -I harness.py --batch < job.json
#
# It mirrors assets/js/harness.js: ListNode / TreeNode conversions and turning
# results into plain JSON. Comparing outputs always happens in JavaScript.

import io
import json
import sys
import time
import traceback
import contextlib

MAX_NODES = 100000
FILENAME = "<solution>"


class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

    def __repr__(self):
        return "ListNode(%r)" % (self.val,)


class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

    def __repr__(self):
        return "TreeNode(%r)" % (self.val,)


def array_to_list(arr):
    if arr is None:
        return None
    dummy = ListNode(0)
    cur = dummy
    for v in arr:
        cur.next = ListNode(v)
        cur = cur.next
    return dummy.next


def list_to_array(head):
    out, seen, node = [], 0, head
    while node is not None:
        seen += 1
        if seen > MAX_NODES:
            raise ValueError("The returned list has more than %d nodes. Is there a cycle?" % MAX_NODES)
        out.append(plain(node.val))
        node = node.next
    return out


def array_to_tree(arr):
    if not arr or arr[0] is None:
        return None
    root = TreeNode(arr[0])
    queue, i, head = [root], 1, 0
    while head < len(queue) and i < len(arr):
        node = queue[head]
        head += 1
        if i < len(arr) and arr[i] is not None:
            node.left = TreeNode(arr[i])
            queue.append(node.left)
        i += 1
        if i < len(arr) and arr[i] is not None:
            node.right = TreeNode(arr[i])
            queue.append(node.right)
        i += 1
    return root


def tree_to_array(root):
    if root is None:
        return []
    out, queue, head, seen = [], [root], 0, 0
    while head < len(queue):
        node = queue[head]
        head += 1
        if node is None:
            out.append(None)
            continue
        seen += 1
        if seen > MAX_NODES:
            raise ValueError("The returned tree has more than %d nodes. Is there a cycle?" % MAX_NODES)
        out.append(plain(node.val))
        queue.append(getattr(node, "left", None))
        queue.append(getattr(node, "right", None))
    while out and out[-1] is None:
        out.pop()
    return out


def base_type(t):
    return "".join(str(t or "any").split())


def convert_in(value, t):
    t = base_type(t)
    if t == "ListNode":
        return array_to_list(value)
    if t == "TreeNode":
        return array_to_tree(value)
    if t == "ListNode[]":
        return [array_to_list(v) for v in (value or [])]
    if t == "TreeNode[]":
        return [array_to_tree(v) for v in (value or [])]
    return json.loads(json.dumps(value))


def convert_out(value, t):
    t = base_type(t)
    if t == "ListNode":
        return list_to_array(value) if value is not None else []
    if t == "TreeNode":
        return tree_to_array(value) if value is not None else []
    return plain(value)


def plain(v, depth=0):
    if depth > 200:
        raise ValueError("Value is nested too deeply to display.")
    if v is None or isinstance(v, (bool, str)):
        return v
    if isinstance(v, int):
        return v
    if isinstance(v, float):
        if v != v:
            return "NaN"
        if v == float("inf"):
            return "Infinity"
        if v == float("-inf"):
            return "-Infinity"
        return v
    if isinstance(v, TreeNode) or (hasattr(v, "val") and hasattr(v, "left") and hasattr(v, "right")):
        return tree_to_array(v)
    if isinstance(v, ListNode) or (hasattr(v, "val") and hasattr(v, "next")):
        return list_to_array(v)
    if isinstance(v, (list, tuple)):
        return [plain(x, depth + 1) for x in v]
    if isinstance(v, (set, frozenset)):
        items = [plain(x, depth + 1) for x in v]
        try:
            return sorted(items)
        except TypeError:
            return items
    if isinstance(v, dict):
        return {str(k): plain(val, depth + 1) for k, val in v.items()}
    if hasattr(v, "tolist"):
        return plain(v.tolist(), depth + 1)
    return repr(v)


def snake(name):
    out = []
    for i, ch in enumerate(name):
        if ch.isupper() and i > 0 and (name[i - 1].islower() or name[i - 1].isdigit() or (i + 1 < len(name) and name[i + 1].islower() and name[i - 1].isupper())):
            out.append("_")
        out.append(ch.lower())
    return "".join(out)


def user_line(tb):
    line = None
    for frame in traceback.extract_tb(tb):
        if frame.filename == FILENAME:
            line = frame.lineno
    return line


def error_text(e):
    if isinstance(e, RecursionError):
        return "RecursionError: maximum recursion depth exceeded (infinite recursion?)"
    return "%s: %s" % (type(e).__name__, e)


_STATE = {"ns": None, "entry": None, "problem": None}


def prepare(code, problem_json):
    """Compile and run the user's code once. Returns a JSON string."""
    problem = json.loads(problem_json)
    sig = problem["signature"]
    ns = {"__name__": "solution", "ListNode": ListNode, "TreeNode": TreeNode}
    from typing import List, Optional, Dict, Tuple, Set  # noqa: F401  (handy for type hints)
    ns.update({"List": List, "Optional": Optional, "Dict": Dict, "Tuple": Tuple, "Set": Set})
    out = io.StringIO()
    try:
        compiled = compile(code, FILENAME, "exec")
    except SyntaxError as e:
        return json.dumps({"ok": False, "error": "SyntaxError: %s" % e.msg, "line": e.lineno})
    try:
        with contextlib.redirect_stdout(out):
            exec(compiled, ns)
    except Exception as e:  # error while defining things at the top level
        return json.dumps({"ok": False, "error": error_text(e), "line": user_line(e.__traceback__), "logs": out.getvalue()})
    name = sig["class"] if sig.get("class") else snake(sig["function"])
    entry = ns.get(name)
    if entry is None:
        what = "class" if sig.get("class") else "function"
        return json.dumps({"ok": False, "error": "Could not find a %s named %s. Keep the name from the starter code." % (what, name), "line": None})
    _STATE.update(ns=ns, entry=entry, problem=problem)
    return json.dumps({"ok": True, "logs": out.getvalue()})


def _method_sig(sig, op):
    if op == sig["class"]:
        return {"params": (sig.get("init") or {}).get("params", []), "returns": "void"}
    for m in sig["methods"]:
        if m["name"] == op:
            return m
    return None


def _run(test):
    problem, entry = _STATE["problem"], _STATE["entry"]
    sig = problem["signature"]
    if sig.get("class"):
        outputs, obj = [], None
        for i, op in enumerate(test["ops"]):
            ms = _method_sig(sig, op)
            if ms is None:
                raise ValueError('Unknown operation "%s".' % op)
            args = [convert_in(x, ms["params"][j]["type"] if j < len(ms["params"]) else None) for j, x in enumerate(test["args"][i] or [])]
            if i == 0:
                obj = entry(*args)
                outputs.append(None)
            else:
                py_name = snake(op)
                fn = getattr(obj, py_name, None) or getattr(obj, op, None)
                if fn is None:
                    raise AttributeError('Your class has no method "%s".' % py_name)
                r = fn(*args)
                outputs.append(None if ms.get("returns") == "void" else convert_out(r, ms.get("returns")))
        return outputs
    params = sig["params"]
    args = [convert_in(x, params[j]["type"] if j < len(params) else None) for j, x in enumerate(test["args"])]
    result = entry(*args)
    if problem.get("mutates"):
        idx = [p["name"] for p in params].index(problem["mutates"])
        return convert_out(args[idx], params[idx]["type"])
    return convert_out(result, sig.get("returns"))


def run_one(test_json):
    """Run one test against the prepared code. Returns a JSON string."""
    test = json.loads(test_json)
    out = io.StringIO()
    start = time.perf_counter()
    try:
        with contextlib.redirect_stdout(out):
            got = _run(test)
        ms = (time.perf_counter() - start) * 1000
        return json.dumps({"ok": True, "got": got, "logs": out.getvalue(), "ms": round(ms, 2)}, allow_nan=False)
    except _Timeout:
        raise
    except Exception as e:
        return json.dumps({"ok": False, "error": error_text(e), "line": user_line(e.__traceback__), "logs": out.getvalue()})


class _Timeout(BaseException):
    pass


def _batch():
    """Command-line mode for tools/check.mjs: read a job from stdin, print results."""
    import signal
    job = json.loads(sys.stdin.read())
    timeout = float(job.get("timeout", 3.0))
    prep = json.loads(prepare(job["code"], json.dumps(job["problem"])))
    results = []
    if prep["ok"]:
        def on_alarm(signum, frame):
            raise _Timeout()
        signal.signal(signal.SIGALRM, on_alarm)
        for test in job["tests"]:
            signal.setitimer(signal.ITIMER_REAL, timeout)
            try:
                results.append(json.loads(run_one(json.dumps(test))))
            except _Timeout:
                results.append({"ok": False, "error": "Time limit exceeded (%.1fs)" % timeout, "line": None, "logs": ""})
            finally:
                signal.setitimer(signal.ITIMER_REAL, 0)
    sys.stdout.write(json.dumps({"prepare": prep, "results": results}))


if __name__ == "__main__" and "--batch" in sys.argv:
    _batch()

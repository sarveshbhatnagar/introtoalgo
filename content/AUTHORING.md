# Authoring guide

This is the only document you need to write lessons and practice problems for introtoalgo.com. Read it once fully. Then copy the samples and the snippets below.

**The samples are the bar.** Before writing, read these files in full and match their structure and tone:

- `content/algorithms/big-o-notation.html` and `content/algorithms/two-pointers.html` (algorithms lessons)
- `content/ai/prompting-basics.html` (AI lesson)
- `content/practice/matching-receipts.json` (hash map, `unordered`), `squared-deviations.json` (two pointers), `reverse-the-playlist.json` (`ListNode`), `generation-averages.json` (`TreeNode`, `approx`)

Contents:

1. [Rules for every writer](#1-rules-for-every-writer)
2. [Voice rules](#2-voice-rules)
3. [Lessons: format](#3-lessons-format)
4. [Lesson components, with snippets](#4-lesson-components)
5. [Lesson quality bar](#5-lesson-quality-bar)
6. [Problems: schema](#6-problems-schema)
7. [Problem quality bar](#7-problem-quality-bar)
8. [Running the validator](#8-running-the-validator)
9. [Reference: tracks, modules, lesson slugs, topic ids](#9-reference-ids-and-slugs)

---

## 1. Rules for every writer

- **Only create the files you were assigned.** A lesson is `content/algorithms/<slug>.html` or `content/ai/<slug>.html`. A problem is `content/practice/<slug>.json`. Do not edit any other file: not `curriculum.json`, not the samples, not anything outside `content/`. Do not run `tools/build.mjs`; the orchestrator does that once at the end.
- **The file name is the slug.** Lesson slugs are fixed by `content/curriculum.json` (listed in section 9). Problem slugs are yours to choose, or given to you: lowercase words joined by hyphens, named after your story, never after the famous problem (`matching-receipts`, not `two-sum`).
- **Run the validator on your files before you finish** and fix every error. Read every warning and fix it unless you have a real reason not to:
  ```
  node tools/check.mjs content/practice/your-problem.json content/algorithms/your-lesson.html
  ```
- **Everything must be original.** Never copy statements, stories, examples or explanations from LeetCode or any other site or book. The classic name goes in `aka` only.
- **Links between pages are root-absolute**: `/algorithms/hash-tables.html`, `/ai/tokens.html`, `/practice/matching-receipts.html`. You may link to any lesson in the curriculum even if nobody has written it yet: until it exists, the build shows the link text without a link. Link to a problem only if you know its slug.

## 2. Voice rules

These apply to every word a learner reads: lesson text, captions, quiz options, hints, stories, walkthroughs.

- Write like a friendly senior engineer explaining to one person at a whiteboard. Second person ("you"). Short sentences. Plain words.
- Start with the problem or a concrete everyday picture, then the idea, then the code. Never start with a definition or history.
- One idea per paragraph. If a sentence does not help the learner do or understand something, cut it.
- Use small concrete examples with real numbers the reader can trace by hand. Show the trace.
- Say why, not just what. Name the common mistake and how to avoid it.
- Be direct: "Use a hash map." not "One might consider utilising a hash map."
- Banned: "delve", "dive in/into", "let's explore", "in today's world", "in the realm of", "it's important to note", "crucial", "leverage", "unlock", "harness", "game-changer", "navigate the landscape", "tapestry", "robust", "seamless", "In conclusion", "buckle up", rhetorical question openers, emoji, exclamation-mark hype, "not just X but Y" constructions, and summaries that only repeat the lesson.
- No filler intros ("In this lesson we will...") and no filler outros. End when the content ends.
- Honest about limits and trade-offs. No hype about AI. For AI topics stay vendor-neutral and avoid facts that go stale (specific model names, prices, benchmark numbers, context-window sizes).

The validator warns about banned phrases, emoji, exclamation marks and a question as the first sentence. A clean validator run does not mean the voice is right; reread your text out loud.

House style: American spelling is not required, but be consistent within a file. Use "JavaScript" and "Python". Write numbers people trace as digits (`3 + 4 = 7`). Use `O(n log n)`, `O(n²)` with the superscript character.

## 3. Lessons: format

A lesson file is a front-matter block followed by an HTML fragment.

```html
<!--
{
  "title": "Two Pointers",
  "description": "Use two indexes that move toward each other or side by side to turn O(n²) pair searches into one O(n) pass.",
  "minutes": 15,
  "tags": ["arrays", "patterns"],
  "legacy": ["mergesort"]
}
-->
<p>First paragraph: the concrete problem or picture.</p>

<h2>First section</h2>
<p>…</p>
```

Front matter is strict JSON (double quotes, no trailing commas) inside an HTML comment that must be the very first thing in the file.

| Key | Required | Rules |
|---|---|---|
| `title` | yes | 3 to 70 characters. Usually the same as the curriculum title. Shown as the page `<h1>`. |
| `description` | yes | Plain text, at most 155 characters (aim for 80 to 155). Used as the page lead and by search engines. Say what the reader will be able to do. |
| `minutes` | yes | Whole number, 3 to 40. Reading time plus time to use the tracer and quiz. Roughly words ÷ 150, plus 3. |
| `tags` | no | List of short lowercase strings. |
| `legacy` | no | Old 2017 posts this lesson replaces, from: `mergesort`, `mst`, `speedinguplinkedlist`, `networktheory`, `communitydetection`, `semanticnetworks`, `markovchains`. They are listed at the end of the lesson. Some are already mapped; adding one twice is harmless. |

Body rules:

- Plain HTML. Close every tag you open, including `</p>` and `</li>`. The validator checks this.
- No `<h1>` (the title is added for you). Sections are `<h2>`; subsections `<h3>`. Every `<h2>` becomes an entry in the "On this page" menu, so keep them short. Use at least two.
- Allowed everyday tags: `p`, `h2`, `h3`, `ul`, `ol`, `li`, `strong`, `em`, `code`, `a`, `table` (with `thead`, `tbody`, `tr`, `th`, `td`), `blockquote`, `br`, `sup`, `sub`, `kbd`.
- Inside text, escape `<`, `>` and `&` as `&lt;`, `&gt;`, `&amp;` (for example `<code>left &lt; right</code>`). Inside code blocks you do **not** escape anything (see below).
- Not allowed: `<pre>` outside `<x-code>`, `<script>` (except the JSON block inside a component), `<style>`, `<iframe>`, `style="…"` attributes, images with relative paths.
- Never put a component inside a `<p>`. Components are block-level, like paragraphs.
- The "Mark lesson complete" button, "Practice this" problem list, archive links and previous/next navigation are added automatically. Do not write them.

## 4. Lesson components

Components are custom tags starting with `x-`. The build turns them into finished HTML. Copy a snippet, then change the content.

### 4.1 Code: `<x-code>`

Every code sample shows JavaScript **and** Python as tabs. The reader's choice is remembered across the whole site.

```html
<x-code>
<pre lang="js">
function sum(nums) {
  let total = 0;
  for (const n of nums) total += n;
  return total;
}
</pre>
<pre lang="py">
def total(nums):
    result = 0
    for n in nums:
        result += n
    return result
</pre>
</x-code>
```

- Write the code exactly as it is. **Do not escape** `<`, `>` or `&` inside `<pre>`; the build does it. Indentation is kept (common leading indentation is removed).
- Exactly one `<pre lang="js">` and one `<pre lang="py">`. Both must do the same thing, with idiomatic naming in each language (`camelCase` in JS, `snake_case` in Python).
- Optional title: `<x-code title="Brute force">`.
- Only when a second language makes no sense (pseudocode, a shell command, JSON, a prompt), use `single` and one block. `lang` may be `js`, `py`, `text`, `json`, `bash`, `sql` or `prompt`:

```html
<x-code single title="Pseudocode">
<pre lang="text">
for each item:
    if it matches: return it
</pre>
</x-code>
```

Keep code short: under about 25 lines per block. Show the core idea, not input parsing. Prefer clear names over clever tricks. Code in lessons is not run by the validator, so test it yourself.

### 4.2 Callouts: `<x-callout>`

```html
<x-callout type="key">
<p>One sentence or two with the idea to remember.</p>
</x-callout>

<x-callout type="mistake" title="Off by one at the end">
<p>What people get wrong, why, and how to avoid it.</p>
</x-callout>

<x-callout type="tip">
<p>A practical shortcut or habit.</p>
</x-callout>

<x-callout type="real-world">
<p>Where this shows up in real software.</p>
</x-callout>
```

`type` is one of `key`, `mistake`, `tip`, `real-world`. `title` is optional and replaces the default label ("Key idea", "Common mistake", "Tip", "In the real world"). The body is normal HTML. Use one `key` per lesson at most, and at least one `mistake`.

### 4.3 Step-through tracer: `<x-tracer>`

The main teaching device. You write the list of steps; the reader clicks Next / Previous or presses Play. Each step has a caption and a state (array cells, pointers, a grid, a tree, a graph, variables). Changed values are animated automatically.

```html
<x-tracer title="Find two prices that add up to 16">
<script type="application/json">
{
  "code": [
    "L = 0, R = n - 1",
    "while L < R:",
    "  sum = prices[L] + prices[R]",
    "  if sum == target: return [L, R]",
    "  if sum > target: R = R - 1",
    "  else: L = L + 1"
  ],
  "codeLang": "text",
  "steps": [
    {
      "caption": "Start with <code>L</code> on the cheapest price and <code>R</code> on the most expensive.",
      "line": 1,
      "array": { "label": "prices", "values": [2, 4, 5, 8, 11, 15], "pointers": { "L": 0, "R": 5 }, "highlight": [0, 5] },
      "vars": { "target": 16 }
    },
    {
      "caption": "2 + 15 = 17. Too big, so 15 can never be in the answer. Move <code>R</code> left.",
      "line": 5,
      "array": { "label": "prices", "values": [2, 4, 5, 8, 11, 15], "pointers": { "L": 0, "R": 4 }, "highlight": [0, 4], "dim": [5] },
      "vars": { "target": 16, "sum": 17 }
    }
  ]
}
</script>
</x-tracer>
```

Top level:

| Key | Required | Meaning |
|---|---|---|
| `steps` | yes | 2 to 60 steps. Aim for 5 to 12. |
| `title` | no | Same as the `title` attribute (the attribute wins). |
| `code` | no | List of code lines shown above the state. Then each step can set `line` (1-based) to highlight the line being run. Keep it short (under 12 lines) and readable; pseudocode is fine. |
| `codeLang` | no | `text` (default), `js`, `py`, … for highlighting `code`. |

Each step (every key except `caption` is optional; use the ones you need, several at once is fine):

| Key | Shape | Shows |
|---|---|---|
| `caption` | string, inline HTML allowed | One or two sentences: what happens in this step and **why**. Required. |
| `line` | integer | Highlights that line of `code`. |
| `array` | object (below) | One row of cells. |
| `arrays` | list of array objects | Several rows (for example an input and an output). Do not use with `array`. |
| `grid` | object (below) | A 2D table, for DP tables and grids. |
| `tree` | object (below) | A binary tree drawing. |
| `graph` | object (below) | Nodes and edges at positions you choose. |
| `vars` | object `{"name": value}` | Variable chips like `sum = 17`. Changed values are highlighted. |

**array**: `{ "label": "nums", "values": [3, 1, 4], "highlight": [0], "mark": [2], "dim": [1], "pointers": { "i": 0, "j": 2 }, "style": "array" }`

- `values`: numbers, short strings, `null` (blank cell).
- `highlight`: indexes drawn in the accent color (the cells being looked at now).
- `mark`: indexes drawn in green (done, found, part of the answer).
- `dim`: indexes faded (ruled out, no longer relevant).
- `pointers`: name → index. Index `-1` (before the start) and `values.length` (one past the end) are allowed and drawn as ghost cells. Several pointers on one cell are fine.
- `style`: `"array"` (default) or `"list"`, which draws arrows between cells and a trailing `null`, for linked lists.

**grid**: `{ "label": "dp", "rows": [[0, 1], [1, 2]], "rowLabels": ["", "a"], "colLabels": ["", "b"], "highlight": [[1, 1]], "mark": [[0, 0]], "dim": [] }` — cells are `[row, col]` pairs, 0-based. Labels are optional.

**tree**: `{ "label": "heap", "values": [9, 5, 8, 1, 3, null, 7], "highlight": [1], "mark": [0], "dim": [] }`

- `values` are in **heap order**: the children of index `i` are at `2i + 1` and `2i + 2`. Use `null` for a missing node. This is *not* the LeetCode-style level order used in problem tests: here every slot of every level exists, so a missing node's children are also `null`. Index layout:
  ```
          0
      1       2
    3   4   5   6
  ```
- At most 31 slots (5 levels). `highlight` / `mark` / `dim` use the same indexes.

**graph**: `{ "nodes": [{"id": "A", "x": 10, "y": 20}, {"id": "B", "x": 60, "y": 20}], "edges": [["A", "B", 4]], "directed": false, "highlight": ["A"], "mark": [], "dim": [], "highlightEdges": [["A", "B"]], "labels": {"A": "d=0"} }`

- `x` and `y` are 0 to 100 (`y` grows downward). Keep nodes at least about 15 apart. The drawing's height follows the largest `y`.
- `edges`: `[from, to]` or `[from, to, weight]`. `directed: true` adds arrowheads.
- `labels`: small text under a node, for distances or visit order.

Writing good tracers:

- One change per step. If two things change, split the step.
- The caption explains *why*, not only what: "Too big, so 15 can never be in the answer" beats "Move R left".
- Repeat the full state in every step. Steps do not inherit from the previous step.
- The last step should show the result and, ideally, a count that makes the cost visible ("4 sums checked instead of 15").
- Hand-check every value. A wrong number in a tracer teaches the wrong thing.

### 4.4 Quick-check quiz: `<x-quiz>`

```html
<x-quiz>
<script type="application/json">
{
  "questions": [
    {
      "question": "A loop over <code>n</code> items calls <code>items.includes(x)</code> each time. What is the time complexity?",
      "options": [
        { "text": "O(n)", "why": "There is a second, hidden loop: <code>includes</code> scans the list." },
        { "text": "O(n²)", "correct": true, "why": "n iterations, each scanning up to n items." },
        { "text": "O(1)", "why": "The work grows with the list, so it cannot be constant." }
      ]
    }
  ]
}
</script>
</x-quiz>
```

- 1 to 4 questions per quiz, 2 to 5 options per question, **exactly one** with `"correct": true`.
- Every option needs a `why` explaining why it is right or wrong. Wrong options should be mistakes people really make, not jokes.
- `question`, `text` and `why` may contain inline HTML (`<code>`, `<strong>`). Inside JSON, write quotes as `\"`.
- Optional attribute: `<x-quiz title="Before you move on">` (default "Quick check").

### 4.5 Complexity summary: `<x-complexity>`

One approach (shown as Time / Space badges):

```html
<x-complexity>
<script type="application/json">
{ "rows": [ { "time": "O(n)", "space": "O(1)", "note": "One pass, two pointers." } ] }
</script>
</x-complexity>
```

Several approaches (shown as a table; `name` is then required):

```html
<x-complexity>
<script type="application/json">
{
  "rows": [
    { "name": "Try every pair", "time": "O(n²)", "space": "O(1)", "note": "About n²/2 sums." },
    { "name": "Two pointers", "time": "O(n)", "space": "O(1)", "note": "Each step moves a pointer inward." }
  ]
}
</script>
</x-complexity>
```

`time` is required; `space` and `note` are optional. `note` may contain inline HTML.

### 4.6 Figure: `<x-figure>` with inline SVG

```html
<x-figure caption="Two pointers start at the ends and move inward.">
<svg viewBox="0 0 400 120" aria-label="Six boxes in a row; arrows under the first and last point inward.">
  <rect x="10" y="20" width="40" height="32" rx="6" class="f-surface s-line"/>
  <text x="30" y="41" text-anchor="middle">2</text>
  <line x1="14" y1="70" x2="46" y2="70" class="s-accent" stroke-width="2.5"/>
  <text x="30" y="92" text-anchor="middle" class="f-accent t-bold">L</text>
</svg>
</x-figure>
```

- The `<svg>` needs a `viewBox` and an `aria-label` describing what it shows. Do not set `width`/`height`; it scales to the column (max 640px wide).
- **Never hard-code colors** (`fill="#333"`). Use these classes so the figure works in light and dark themes:

| Class | Effect | Class | Effect |
|---|---|---|---|
| `f-fg` | text-colored fill | `s-fg` | text-colored stroke |
| `f-muted` | grey fill | `s-muted` | grey stroke |
| `f-bg` | page background fill | `s-line` | border-grey stroke |
| `f-surface` | light panel fill (good for boxes) | `s-accent` | track accent stroke |
| `f-accent` / `f-accent-soft` | accent fill / tint | `s-good` / `s-bad` / `s-info` | green / red / blue stroke |
| `f-good` / `f-good-soft` | green fill / tint | `s-thin` / `s-thick` | stroke width 1 / 3 |
| `f-bad` / `f-bad-soft` | red fill / tint | `s-dash` | dashed stroke |
| `f-info` | blue fill | `f-none` | no fill (use on lines and paths) |

- Text: `<text>` is mono 14px in the text color by default. Add `t-sans` (UI font), `t-small` (11px), `t-big` (18px bold), `t-bold`. Combine with `f-*` to color it.
- Arrowheads: define a marker with a unique id per lesson and give its path an `f-*` class:
  ```html
  <defs><marker id="mylesson-arrow" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0 10 5 0 10z" class="f-accent"/></marker></defs>
  <line x1="10" y1="10" x2="80" y2="10" class="s-accent" stroke-width="2" marker-end="url(#mylesson-arrow)"/>
  ```
- Keep text at least 12 units tall in a viewBox about 400 to 520 wide, or it is unreadable on phones. Do not cram.
- Use a figure for structure and shapes. If the picture changes over time, use a tracer instead.
- Add `wide` (`<x-figure wide caption="…">`) only if the figure really needs the full width.
- A raster image is allowed instead of SVG only for photos/screenshots: `<img src="/images/name.png" alt="…">` with a root-absolute path. You cannot add image files yourself, so in practice use SVG.

### 4.7 Try-it exercise: `<x-tryit>`

An open-ended task. The reader writes in a box (saved on their device), then reveals your sample answer. Use heavily in the AI track: give a weak prompt, the learner rewrites it, reveal an improved version with the reasoning.

```html
<x-tryit title="Fix the landlord email">
<x-task>
<p>This prompt produced a stiff, generic email. Rewrite it so the assistant has what it needs.</p>
</x-task>
<x-start>
Write an email to my landlord about the heating.
</x-start>
<x-answer>
<p>One stronger version:</p>
<x-prompt label="Rewritten prompt" tone="good">
<x-user>
Write a short email to my landlord asking them to fix the heating. …
</x-user>
</x-prompt>
<p>Why it works: …</p>
</x-answer>
</x-tryit>
```

- `<x-task>` (required, HTML): what to do.
- `<x-start>` (optional, plain text, not escaped): pre-filled into the box, for example the weak prompt. Leave it out for a blank box.
- `<x-answer>` (required, HTML): a sample answer **and the reasoning**. It may contain `<x-code>`, `<x-prompt>` and callouts.
- In the algorithms track, use try-its for "trace this by hand" or "predict the output" tasks.

### 4.8 Prompt and response: `<x-prompt>`

Shows a conversation with a model. It is always labelled "Illustrative example. Real replies vary." Write replies that are realistic, not perfect, and never name a specific model or vendor.

```html
<x-prompt label="Vague prompt" tone="weak">
<x-system>
You are a support assistant for a bike shop. Answer in two sentences.
</x-system>
<x-user>
Summarize this article.
</x-user>
<x-model>
The article discusses a company's migration…
</x-model>
</x-prompt>
```

- Children, in the order shown: `<x-system>` (optional), then any number of `<x-user>` and `<x-model>` turns. At least one `<x-user>`.
- Turn text is plain text: line breaks are kept and nothing needs escaping (write `<article>` directly).
- `label` (optional): a short heading such as "Vague prompt", "Specific prompt", "Second attempt".
- `tone` (optional): `weak` (red), `good` (green) or `neutral` (default). Use `weak` and `good` in pairs to contrast versions.
- Banned-phrase checks skip prompt turns, so a deliberately bad prompt may contain bad phrasing.

## 5. Lesson quality bar

Structure, in this order (headings are yours to word):

1. **Hook.** One or two paragraphs with a concrete problem or everyday picture. No heading before it. No definitions, no history.
2. **The idea.** In plain words, before any code.
3. **A hand-traced example** with small real numbers, usually as an `<x-tracer>`.
4. **Code** in `<x-code>`, JavaScript and Python.
5. **Complexity** in `<x-complexity>` with a one-line reason (algorithms track; optional in AI).
6. **Common mistakes**: at least one `<x-callout type="mistake">`, ideally two or three.
7. **Quiz**: one `<x-quiz>` near the end, 2 to 4 questions.
8. **What to practise next**: a final short `<h2>` section with one or two sentences linking to the next lesson(s) and, if you know them, problems. Then stop. No summary.

Requirements:

- 900 to 1,600 words (the validator counts prose, captions and quiz text, not code).
- At least one `<x-tracer>` or `<x-figure>` (AI lessons may use `<x-prompt>` instead). Algorithms lessons should usually have both a tracer and a figure.
- AI lessons: include an `<x-tryit>`. Prefer `<x-prompt>` examples over describing prompts in prose. For ML lessons, code can be small NumPy-free Python/JS that shows the idea (a gradient step, a dot product).
- Every number in a trace, table, quiz and figure is correct. Check them by hand or with a quick script.
- No forward references without a link ("we will see later" is not allowed; link to the lesson instead).

## 6. Problems: schema

A problem is one JSON file, `content/practice/<slug>.json`. Unknown keys are errors. Long text fields (`story`, `task`, `bruteForce`, `hints[i]`, `explanation`, all of `solution` except `time`/`space`, `checker`, starter and solution code) can be **a string or a list of lines**; lists are joined with newlines. Use lists of lines for code, it is much easier to read and edit.

### 6.1 Full annotated example

```jsonc
{
  "slug": "matching-receipts",          // = file name. lowercase-hyphenated, named after YOUR story
  "title": "Matching Receipts",         // 3-70 chars, title case, your own name for it
  "topic": "arrays-hashing",            // exactly one practice topic id (section 9)
  "difficulty": "easy",                 // "easy" | "medium" | "hard"
  "pattern": "hash map",                // short lowercase label; reuse existing labels (6.4)
  "aka": "Two Sum",                     // optional: the classic name people search for
  "order": 1,                           // position within the topic (you will be told it)

  "story": [                            // HTML. The statement as a concrete, relatable scenario.
    "<p>You went on a trip with a friend and paid for everything. …</p>",
    "<p>Which two receipts was your friend paying for?</p>"
  ],
  "task": [                             // HTML. Precise: function name, input, output, edge rules.
    "<p>Write <code>findPair(amounts, target)</code>. Return the positions … in either order.</p>",
    "<p>Each receipt can be used once. There is always exactly one correct pair.</p>"
  ],
  "constraints": [                      // plain strings, shown in mono
    "2 ≤ amounts.length ≤ 10,000",
    "1 ≤ amounts[i] ≤ 1,000,000",
    "Exactly one pair of different positions adds up to target."
  ],

  "examples": [                         // 1-4. Shown in the statement AND used by "Run".
    {
      "args": [[40, 25, 75, 15], 100],  // one entry per param, in order
      "expected": [1, 2],
      "explanation": "25 + 75 = 100. … No other pair works: 40 would need a 60 …"  // walk through WHY
    }
  ],

  "hints": [                            // 3-5, revealed one at a time
    "Pick any one receipt. If it is part of the answer, what must the other amount be?",   // a question that makes them notice
    "For each receipt a, the partner must be exactly target - a. …",
    "Which data structure answers \"have I seen this value?\" in one step?",
    "Walk once. Keep a map amount → position. Look up target - a before storing a."      // nearly the approach
  ],
  "bruteForce": [                       // HTML: the obvious slow way, and why it is too slow
    "<p>Try every pair …</p>",
    "<p>With 10,000 receipts that is about 50 million pairs …</p>"
  ],

  "signature": {
    "function": "findPair",             // camelCase. Python uses snake_case automatically: find_pair
    "params": [
      {"name": "amounts", "type": "int[]"},
      {"name": "target", "type": "int"}
    ],
    "returns": "int[]"
  },
  "starter": {                          // must parse, and must NOT pass the tests
    "js": ["/**", " * @param {number[]} amounts", " * @param {number} target", " * @return {number[]}", " */",
           "function findPair(amounts, target) {", "  // Your code here", "}"],
    "py": ["def find_pair(amounts: list[int], target: int) -> list[int]:", "    # Your code here", "    pass"]
  },

  "tests": [                            // at least 8 hidden tests, edge cases included
    {"args": [[5, 5], 10], "expected": [0, 1], "note": "duplicates"},   // "note" is optional, for writers
    {"args": [[1, 999999], 1000000], "expected": [0, 1]}
    // …
  ],
  "compare": "unordered",               // "exact" (default) | "unordered" | "approx" | "checker"

  "solution": {
    "js": ["function findPair(amounts, target) {", "  const seen = new Map();", "  …", "}"],
    "py": ["def find_pair(amounts, target):", "    seen = {}", "    …"],
    "walkthrough": ["<p>The brute force searches … </p>", "<ol><li>…trace…</li></ol>"],  // HTML, with a hand trace
    "time": "O(n)",
    "timeWhy": "One pass, and each map lookup is O(1) on average.",
    "space": "O(n)",
    "spaceWhy": "The map can hold every amount.",
    "takeaway": "When you need a partner for each element, store what you have seen in a hash map …"  // the reusable pattern
  },
  "related": ["hash-tables", "arrays"]  // lesson slugs (section 9), most relevant first, at least one
}
```

(The real file is plain JSON: no comments. Open `content/practice/matching-receipts.json` for the exact file.)

### 6.2 Types

Param and return types: `int`, `float`, `string`, `bool`, `any`, `ListNode`, `TreeNode`, and any of these followed by `[]` once or more (`int[]`, `string[][]`, `ListNode[]`). Return type may also be `void` (see in-place). Test values are checked against the declared types. `null` is accepted anywhere (for "return null / None if there is no answer").

- **`ListNode`**: a singly linked list. In tests you write it as an array: `[3, 8, 1, 9]`; empty list is `[]` (the function receives `null` / `None`). The function receives real nodes with `val` and `next`, and if it returns a `ListNode`, the result is converted back to an array (returning `null` / `None` becomes `[]`). Cycles are detected and reported.
- **`TreeNode`**: a binary tree. In tests you write it in **level order with `null` for missing children**, the LeetCode format: `[12, 8, 10, 7, 9, null, 15]`. Children of a `null` are not listed. Empty tree is `[]`. Nodes have `val`, `left`, `right`. Returned trees are converted back to level order with trailing `null`s removed.
- `ListNode` and `TreeNode` classes are predefined in both languages (`ListNode(val, next)`, `TreeNode(val, left, right)`). Repeat their definition as a comment at the top of the starter, as in `reverse-the-playlist.json` and `generation-averages.json`.
- Floats that are infinite or NaN are compared as the strings `"Infinity"`, `"-Infinity"`, `"NaN"`. Avoid them.
- Python tuples come back as lists, sets as sorted lists, dict keys as strings. JS `undefined` becomes `null`.

### 6.3 Comparison modes

| `compare` | Passes when | Use for |
|---|---|---|
| `exact` (default) | deep equality | one correct answer |
| `unordered` | the returned **top-level** list equals `expected` in any order | "return the items in any order". Inner lists still must match exactly; if inner order is also free, ask for a sorted inner order in the task or use a checker. |
| `approx` | deep equality, numbers within 1e-6 (absolute or relative) | floating-point results, ML problems |
| `checker` | your JavaScript `check` function returns `true` | several valid answers (any valid path, any peak) |

Checker example:

```json
"compare": "checker",
"checker": [
  "function check(args, got, expected) {",
  "  const nums = args[0];",
  "  if (!Number.isInteger(got) || got < 0 || got >= nums.length) return 'index out of range';",
  "  const left = got === 0 ? -Infinity : nums[got - 1];",
  "  const right = got === nums.length - 1 ? -Infinity : nums[got + 1];",
  "  return nums[got] > left && nums[got] > right ? true : 'that index is not a peak';",
  "}"
]
```

- `args` are the test's args as written in JSON (arrays for ListNode/TreeNode), `got` is the learner's output as plain JSON, `expected` is the test's `expected`. Return `true` to pass. Return `false` or a short string (shown to the learner) to fail.
- `expected` must still be one valid answer; it is shown as "one valid answer". The validator checks that your checker accepts every `expected`.
- The checker runs in plain JavaScript for both languages. Keep it simple and deterministic.

### 6.4 Other problem kinds

**In-place** ("modify the array, return nothing"): set `"returns": "void"` and `"mutates": "<param name>"`. The value of that argument after the call is compared with `expected`.

```json
"signature": {"function": "moveZeros", "params": [{"name": "nums", "type": "int[]"}], "returns": "void"},
"mutates": "nums",
"tests": [{"args": [[0, 1, 0, 3]], "expected": [1, 3, 0, 0]}]
```

**Design a class**: the signature names a class, its constructor params (`init`) and methods. Each test is a sequence of operations. `ops[0]` is always the class name (construct), and `expected` has one entry per op: `null` for the constructor and `void` methods.

```json
"signature": {
  "class": "HitLog",
  "init": {"params": [{"name": "window", "type": "int"}]},
  "methods": [
    {"name": "hit", "params": [{"name": "t", "type": "int"}], "returns": "void"},
    {"name": "count", "params": [{"name": "t", "type": "int"}], "returns": "int"}
  ]
},
"examples": [
  {
    "ops": ["HitLog", "hit", "hit", "count"],
    "args": [[3], [1], [2], [4]],
    "expected": [null, null, null, 1],
    "explanation": "Window 3. At t = 4 only hits after t = 1 count, so just the hit at 2."
  }
]
```

Method names are camelCase; Python methods use the snake_case form automatically (`getRecent` → `get_recent`). The Python class name is the same as in JS. Design problems do not support `ListNode`/`TreeNode` params; `compare` applies to the whole outputs list (use `exact`).

**Not supported** (do not write these): problems that read input or print output as the answer, randomised answers without a checker, performance tests with huge inputs (the timeout is 3 s in JavaScript and 5 s in Python, and only exists to stop infinite loops), interactive problems, multiple functions to implement, problems that need imports beyond each language's standard library.

Patterns: reuse a label that already exists when it fits so the filter stays useful. Current labels: `hash map`, `two pointers`, `pointer reversal`, `breadth-first search`. Others you may use: `sliding window`, `prefix sums`, `stack`, `monotonic stack`, `queue`, `binary search`, `sorting`, `depth-first search`, `recursion`, `backtracking`, `greedy`, `intervals`, `dynamic programming`, `heap`, `trie`, `union-find`, `topological sort`, `shortest path`, `bit manipulation`, `matrix`, `math`, `simulation`, `design`, `linear algebra`, `gradient descent`, `probability`.

### 6.5 Starter and solution code

- Starter: the signature plus a doc comment with types and a placeholder (`// Your code here` and nothing returned, `pass` in Python). It must parse and must not pass. Do not put hints in the starter.
- Python names: the function is the snake_case form of `signature.function`. Type hints are welcome (`list[int]`, `ListNode | None`); `List`, `Optional`, `Dict`, `Tuple`, `Set` are also predefined.
- Reference solutions: the clean, optimal approach from the walkthrough, with short comments. Both must pass every test; the validator runs them (JavaScript in Node, Python with `python3`). Standard library only (`collections`, `heapq`, `math`, `bisect`, `functools` are fine in Python).
- The JS solution is also used to compute "expected output" when a learner runs custom input, so it must handle any valid input, not just the tests.

## 7. Problem quality bar

- **Original scenario.** A small, concrete, believable situation (receipts, playlists, sensors, a lab, a delivery route). Not a costume ("Alice has an array"), not copied. The story is 2 short paragraphs at most; the precise rules live in `task` and `constraints`.
- **Precise task.** A reader must be able to solve it from `task` + `constraints` alone: input ranges, empty input behaviour, tie-breaking, return format, what to return when there is no answer.
- **Examples teach.** 1 to 3 examples whose explanations walk through *why*, including why an obvious wrong answer is wrong where useful.
- **Hint ladder, 3 to 5 hints.** Hint 1 is a question that makes the learner notice something. Each hint goes one step further. The last nearly gives the approach but not the code.
- **Brute force first.** Describe the obvious approach and the concrete reason it is too slow (plug in the max `n`).
- **Tests.** At least 8 hidden tests on top of the examples, including edge cases: empty input (if allowed), one element, all equal values, negatives/zeros, the answer at the very start and very end, the largest values from the constraints. Keep each test small and readable; no huge inputs.
- **Walkthrough** with a short hand trace on the first example, then `time`/`space` with a one-line reason each, and a `takeaway` that names the reusable pattern.
- **Both reference solutions verified** by the validator.
- Difficulty: `easy` = one standard idea applied directly; `medium` = combine two ideas or one non-obvious insight; `hard` = several insights or careful state design.

## 8. Running the validator

Requirements: Node 22 and `python3` (3.10+). No `npm install` is needed. The validator never writes into the repository, so any number of writers can run it at once.

```
node tools/check.mjs content/practice/my-problem.json         # one file
node tools/check.mjs content/ai/tokens.html content/ai/embeddings.html
node tools/check.mjs content/practice/                         # a whole folder
node tools/check.mjs                                           # everything
node tools/check.mjs --no-run content/practice/x.json          # schema only, skip running code
```

Output shows `OK`, `WARN` or `FAIL` per file with line numbers for lessons. It exits with code 1 if there is any error. For problems it checks the schema and types, runs both reference solutions against every example and test with the same harness the browser uses, checks that both starters parse and do not pass, and that the checker accepts every expected value. For lessons it checks front matter, tag balance, every component's markup and JSON, links, length and the voice rules.

To see a page as learners will, the orchestrator runs `node tools/build.mjs` and `node tools/serve.mjs`; writers do not need to.

## 9. Reference: ids and slugs

### Algorithms track (`content/algorithms/<slug>.html`, URL `/algorithms/<slug>.html`)

| Module id | Module | Lesson slugs, in order |
|---|---|---|
| `foundations` | 1. Foundations | `what-is-an-algorithm`, `big-o-notation`, `recursion`, `math-for-algorithms`, `how-to-approach-a-problem` |
| `arrays-hashing` | 2. Arrays, Strings & Hashing | `arrays`, `strings`, `hash-tables`, `two-pointers`, `sliding-window`, `prefix-sums` |
| `linear-structures` | 3. Linked Lists, Stacks & Queues | `linked-lists`, `stacks`, `queues-and-deques`, `monotonic-stack` |
| `sorting-searching` | 4. Sorting & Searching | `simple-sorts`, `merge-sort`, `quicksort`, `heap-sort`, `counting-and-radix-sort`, `binary-search`, `binary-search-on-the-answer` |
| `trees` | 5. Trees | `binary-trees`, `tree-traversals`, `binary-search-trees`, `heaps-and-priority-queues`, `tries`, `balanced-trees` |
| `graphs-1` | 6. Graphs: Traversal | `graph-basics`, `breadth-first-search`, `depth-first-search`, `topological-sort` |
| `graphs-2` | 7. Graphs: Paths & Connectivity | `union-find`, `dijkstra`, `bellman-ford-and-floyd-warshall`, `minimum-spanning-trees` |
| `techniques` | 8. Problem-Solving Techniques | `backtracking`, `greedy-algorithms`, `divide-and-conquer`, `intervals`, `bit-manipulation` |
| `dynamic-programming` | 9. Dynamic Programming | `dp-introduction`, `dp-1d`, `dp-on-grids`, `knapsack`, `dp-on-strings`, `longest-increasing-subsequence` |
| `advanced` | 10. Advanced Topics | `string-matching`, `segment-and-fenwick-trees`, `designing-data-structures` |

### AI track (`content/ai/<slug>.html`, URL `/ai/<slug>.html`)

| Module id | Module | Lesson slugs, in order |
|---|---|---|
| `ml-foundations` | 1. Machine Learning Foundations | `what-is-machine-learning`, `how-models-learn`, `regression-and-classification`, `overfitting-and-evaluation`, `decision-trees-and-ensembles`, `neural-networks`, `embeddings` |
| `how-llms-work` | 2. How LLMs Work | `what-is-an-llm`, `tokens`, `attention-and-transformers`, `training-and-fine-tuning`, `sampling-and-temperature`, `why-models-hallucinate` |
| `prompting` | 3. Prompting | `prompting-basics`, `be-clear-and-specific`, `show-examples`, `give-the-model-room-to-think`, `structured-output`, `system-prompts`, `debugging-prompts`, `prompt-injection` |
| `context` | 4. Context Engineering | `what-is-context`, `the-context-window`, `context-engineering`, `rag-basics`, `chunking-and-retrieval`, `memory`, `tools-and-mcp`, `context-rot` |
| `agents` | 5. Agents | `what-is-an-agent`, `tool-use`, `the-agent-loop`, `planning-and-multi-agent`, `evals`, `guardrails` |
| `working-with-ai` | 6. Working With AI | `coding-with-ai`, `verifying-ai-output`, `writing-a-good-brief`, `learning-with-ai`, `privacy-and-security`, `choosing-a-model`, `common-mistakes` |

### Practice topics (`"topic"` in a problem)

| Topic id | Title | Lessons it practises |
|---|---|---|
| `arrays-hashing` | Arrays & Hashing | arrays, strings, hash-tables, prefix-sums |
| `two-pointers-sliding-window` | Two Pointers & Sliding Window | two-pointers, sliding-window |
| `linked-lists-stacks-queues` | Linked Lists, Stacks & Queues | linked-lists, stacks, queues-and-deques, monotonic-stack |
| `binary-search-sorting` | Binary Search & Sorting | simple-sorts, merge-sort, quicksort, heap-sort, counting-and-radix-sort, binary-search, binary-search-on-the-answer |
| `trees` | Trees | binary-trees, tree-traversals, binary-search-trees, balanced-trees |
| `graphs` | Graphs | graph-basics, breadth-first-search, depth-first-search, topological-sort, union-find, dijkstra, bellman-ford-and-floyd-warshall, minimum-spanning-trees |
| `backtracking-recursion` | Backtracking & Recursion | recursion, backtracking, divide-and-conquer |
| `greedy-intervals` | Greedy & Intervals | greedy-algorithms, intervals |
| `dynamic-programming` | Dynamic Programming | dp-introduction, dp-1d, dp-on-grids, knapsack, dp-on-strings, longest-increasing-subsequence |
| `heaps-tries-bits` | Heaps, Tries & Bits | heaps-and-priority-queues, tries, bit-manipulation, string-matching, segment-and-fenwick-trees, designing-data-structures |
| `ml-from-scratch` | ML From Scratch | how-models-learn, regression-and-classification, overfitting-and-evaluation, decision-trees-and-ensembles, neural-networks, embeddings, tokens, attention-and-transformers, sampling-and-temperature |

A lesson's "Practice this" list shows problems whose `related` includes that lesson first, then other problems from topics that practise it. So put the lessons a problem really exercises in `related`, most relevant first.

`ml-from-scratch` problems implement one ML building block with plain lists and loops (no NumPy): for example a mean squared error, one gradient-descent step, softmax, cosine similarity, a k-nearest-neighbour vote, a confusion matrix, greedy decoding from a probability table. Use `"compare": "approx"` for floating-point results, and state rounding rules in the task if any.

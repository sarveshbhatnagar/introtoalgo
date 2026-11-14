# Authoring guide

This is the only document you need to write lessons and practice problems for introtoalgo.com. Read it once fully. Then copy the samples and the snippets below.

**The samples are the bar.** Before writing, read these files in full and match their structure and tone:

- `content/algorithms/big-o-notation.html` and `content/algorithms/two-pointers.html` (algorithms lessons)
- `content/ai/prompting-basics.html` (AI lesson)
- `content/system-design/caching.html` (system design concept lesson) and `content/system-design/design-a-url-shortener.html` (system design case study)
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
10. [System design track](#10-system-design-track): components, the concept and case-study quality bars

---

## 1. Rules for every writer

- **Only create the files you were assigned.** A lesson is `content/algorithms/<slug>.html`, `content/system-design/<slug>.html` or `content/ai/<slug>.html`. A problem is `content/practice/<slug>.json`. Do not edit any other file: not `curriculum.json`, not the samples, not anything outside `content/`. Do not run `tools/build.mjs`; the orchestrator does that once at the end.
- **The file name is the slug.** Lesson slugs are fixed by `content/curriculum.json` (listed in section 9). Problem slugs are yours to choose, or given to you: lowercase words joined by hyphens, named after your story, never after the famous problem (`matching-receipts`, not `two-sum`).
- **Run the validator on your files before you finish** and fix every error. Read every warning and fix it unless you have a real reason not to:
  ```
  node tools/check.mjs content/practice/your-problem.json content/algorithms/your-lesson.html
  ```
- **Everything must be original.** Never copy statements, stories, examples or explanations from LeetCode or any other site or book. The classic name goes in `aka` only.
- **Links between pages are root-absolute**: `/algorithms/hash-tables.html`, `/system-design/caching.html`, `/ai/tokens.html`, `/practice/matching-receipts.html`. You may link to any lesson in the curriculum even if nobody has written it yet: until it exists, the build shows the link text without a link. Link to a problem only if you know its slug.

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
| `kind` | system design only | `"design"` for a case study (every lesson in the Classic Designs and Harder Designs modules, and only those). Leave it out for every other lesson. See [section 10](#10-system-design-track). |
| `legacy` | no | Old 2017 posts this lesson replaces, from: `mergesort`, `mst`, `speedinguplinkedlist`, `networktheory`, `communitydetection`, `semanticnetworks`, `markovchains`. They are listed at the end of the lesson. Some are already mapped; adding one twice is harmless. |

Body rules:

- Plain HTML. Close every tag you open, including `</p>` and `</li>`. The validator checks this.
- No `<h1>` (the title is added for you). Sections are `<h2>`; subsections `<h3>`. Every `<h2>` becomes an entry in the "On this page" menu, so keep them short. Use at least two.
- Allowed everyday tags: `p`, `h2`, `h3`, `ul`, `ol`, `li`, `strong`, `em`, `code`, `a`, `table` (with `thead`, `tbody`, `tr`, `th`, `td`), `blockquote`, `br`, `sup`, `sub`, `kbd`.
- Inside text, escape `<`, `>` and `&` as `&lt;`, `&gt;`, `&amp;` (for example `<code>left &lt; right</code>`). Inside code blocks you do **not** escape anything (see below).
- Not allowed: `<pre>` outside `<x-code>`, `<script>` (except the JSON block inside a component), `<style>`, `<iframe>`, `style="…"` attributes, images with relative paths.
- Never put a component inside a `<p>`. Components are block-level, like paragraphs. The validator reports it.
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
- `<x-answer>` (required, HTML): a sample answer **and the reasoning**. It may contain `<x-code>`, `<x-prompt>`, `<x-figure>` and `<x-callout>`. Do not nest a try-it, quiz or tracer inside it.
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

This is the bar for the algorithms and AI tracks. System design lessons follow [section 10](#10-system-design-track) instead.

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

  "examples": [                         // 1-3 (4 at most). Shown in the statement AND used by "Run".
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

Param and return types: `int`, `float`, `string`, `bool`, `any`, `ListNode`, `TreeNode`, and any of these followed by `[]` once or more (`int[]`, `string[][]`, `ListNode[]`). Return type may also be `void` (see in-place). Test values are checked against the declared types. `null` is accepted anywhere (for "return null / None if there is no answer"), except as the `expected` value of a `ListNode` or `TreeNode` result: an empty list or tree is always written `[]`.

- **`ListNode`**: a singly linked list. In tests you write it as an array: `[3, 8, 1, 9]`; empty list is `[]` (the function receives `null` / `None`). The function receives real nodes with `val` and `next`, and if it returns a `ListNode`, the result is converted back to an array (returning `null`, `None` or a bare `return;` in JavaScript becomes `[]`). Returning a plain array instead of nodes is reported to the learner as an error. Cycles are detected and reported.
- **`TreeNode`**: a binary tree. In tests you write it in **level order with `null` for missing children**, the LeetCode format: `[12, 8, 10, 7, 9, null, 15]`. Children of a `null` are not listed. Empty tree is `[]`. Nodes have `val`, `left`, `right`. Returned trees are converted back to level order with trailing `null`s removed.
- `ListNode[]` and `TreeNode[]` (a list of lists or trees) work the same way for each element, in both directions. Deeper nesting (`ListNode[][]`) is not supported.
- `ListNode` and `TreeNode` classes are predefined in both languages (`ListNode(val, next)`, `TreeNode(val, left, right)`). Repeat their definition as a comment at the top of the starter, as in `reverse-the-playlist.json` and `generation-averages.json`.
- Floats that are infinite or NaN are compared as the strings `"Infinity"`, `"-Infinity"`, `"NaN"`. Avoid them.
- Python tuples come back as lists, sets as sorted lists, dict keys as strings. JavaScript `Set`s come back as arrays in insertion order, `Map`s as objects. JS `undefined` becomes `null`. If the answer is really a set, use `"compare": "unordered"` so either form passes.
- Integers must stay within ±9,007,199,254,740,991 (JavaScript's safe integer range). Larger values lose precision in tests and in JavaScript answers. If a result can grow past it, ask for it modulo a number in the task.

### 6.3 Comparison modes

| `compare` | Passes when | Use for |
|---|---|---|
| `exact` (default) | deep equality | one correct answer |
| `unordered` | the returned **top-level** list equals `expected` in any order (the result type must be a list, like `int[]`) | "return the items in any order". Inner lists still must match exactly; if inner order is also free, ask for a sorted inner order in the task or use a checker. |
| `approx` | deep equality, numbers within 1e-6 (absolute or relative) | floating-point results, ML problems. The validator warns if a `float` result uses `exact`, and tells you when a reference "fails" only by rounding. |
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

- `args` are the test's args as written in JSON (arrays for ListNode/TreeNode), `got` is the learner's output as plain JSON, `expected` is the test's `expected`. Design problems also pass `ops` as a fourth argument. Return `true` to pass. Return `false` or a short string (shown to the learner) to fail.
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
- Python names: the function is the snake_case form of `signature.function`. Arguments are passed by position, so write Python parameter names in snake_case (`max_weight` for a `maxWeight` param). Type hints are welcome (`list[int]`, `ListNode | None`); `List`, `Optional`, `Dict`, `Tuple`, `Set` are also predefined.
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

Output shows `OK`, `WARN` or `FAIL` per file with line numbers for lessons. It exits with code 1 if there is any error. When a solution hits the time limit, the remaining tests of that run are skipped ("Not run: an earlier test timed out"), so fix the loop first. For problems it checks the schema and types, runs both reference solutions against every example and test with the same harness the browser uses, checks that both starters parse and do not pass, and that the checker accepts every expected value. For lessons it checks front matter, tag balance, every component's markup and JSON, links, length and the voice rules.

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

### System design track (`content/system-design/<slug>.html`, URL `/system-design/<slug>.html`)

| Module id | Module | Lesson slugs, in order |
|---|---|---|
| `interview` | 1. The Interview | `how-the-interview-works`, `a-framework-for-any-design`, `requirements-and-scope`, `back-of-the-envelope-estimation`, `api-design`, `data-modeling` |
| `serving-traffic` | 2. Building Blocks: Serving Traffic | `networking-essentials`, `load-balancing`, `caching`, `cdns`, `realtime-communication`, `rate-limiting` |
| `storing-data` | 3. Building Blocks: Storing Data | `choosing-a-database`, `indexing`, `replication`, `sharding-and-partitioning`, `consistent-hashing`, `blob-storage`, `search-systems` |
| `distributed-ideas` | 4. Distributed Systems Ideas | `cap-and-consistency`, `transactions-and-isolation`, `message-queues-and-streams`, `idempotency-and-retries`, `consensus-and-leader-election`, `unique-ids`, `reliability-and-failure`, `observability` |
| `classic-designs` | 5. Classic Designs (case studies, `"kind": "design"`) | `design-a-url-shortener`, `design-a-rate-limiter`, `design-a-key-value-store`, `design-a-news-feed`, `design-a-chat-app`, `design-a-notification-system`, `design-typeahead-search` |
| `harder-designs` | 6. Harder Designs (case studies, `"kind": "design"`) | `design-a-web-crawler`, `design-video-streaming`, `design-ride-sharing`, `design-file-sync`, `design-ticket-booking`, `design-a-payment-system`, `design-a-job-scheduler`, `design-a-rag-system` |
| `interview-craft` | 7. Interview Craft | `talking-through-trade-offs`, `system-design-mistakes`, `what-changes-by-level`, `numbers-to-know`, `mock-interview-practice` |

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
| `system-design-blocks` | System Design Building Blocks | rate-limiting, consistent-hashing, caching, unique-ids, load-balancing |

A lesson's "Practice this" list shows problems whose `related` includes that lesson first, then other problems from topics that practise it. So put the lessons a problem really exercises in `related`, most relevant first.

`ml-from-scratch` problems implement one ML building block with plain lists and loops (no NumPy): for example a mean squared error, one gradient-descent step, softmax, cosine similarity, a k-nearest-neighbour vote, a confusion matrix, greedy decoding from a probability table. Use `"compare": "approx"` for floating-point results, and state rounding rules in the task if any.

## 10. System design track

Read this whole section before writing a system design lesson. Sections 1 to 3 (rules, voice, format) and the components in section 4 still apply; this section adds the track's own components and replaces the quality bar in section 5.

The track teaches people preparing for system design interviews. Every lesson answers two questions: how does this really work, and how do I use it, out loud, in an interview?

### 10.1 Two kinds of lesson

| Kind | Which lessons | Front matter | Length (validator) |
|---|---|---|---|
| Concept | modules 1 to 4 and 7: building blocks and ideas | no `kind` | 900 to 1,600 words |
| Case study | modules 5 and 6: every `design-a-…` slug | `"kind": "design"` | 1,800 to 3,200 words |

- Code is optional in this track. If you show code, the normal `<x-code>` rules apply (JavaScript and Python tabs, or `single` for HTTP, SQL, JSON or pseudocode, which is the usual case here).
- `minutes` is still words ÷ 150 + 3, plus time for exercises. Case studies are usually 25 to 35.
- Diagrams use `<x-arch>`, not hand-drawn `<x-figure>` SVG. Keep `<x-figure>` for pictures that are not boxes and arrows (a hash ring, a timeline).

### 10.2 Architecture diagram: `<x-arch>`

You place each box on a grid; the build draws the boxes, routes the arrows around other boxes and places the labels.

```html
<x-arch caption="Reads go through a cache; writes go straight to the database.">
<script type="application/json">
{
  "nodes": [
    { "id": "client", "label": "Browser", "kind": "client", "col": 0, "row": 1 },
    { "id": "lb", "label": "Load balancer", "kind": "load-balancer", "col": 1, "row": 1 },
    { "id": "app", "label": "App servers", "kind": "service", "col": 2, "row": 1, "stack": true },
    { "id": "cache", "label": "Cache", "kind": "cache", "col": 3, "row": 0 },
    { "id": "db", "label": "Database", "kind": "database", "col": 3, "row": 2 }
  ],
  "edges": [
    { "from": "client", "to": "lb", "label": "HTTPS" },
    { "from": "lb", "to": "app" },
    { "from": "app", "to": "cache", "label": "get / set" },
    { "from": "app", "to": "db", "label": "read on miss" }
  ]
}
</script>
</x-arch>
```

- `caption` is required: one sentence saying what the reader should notice.
- **Nodes.** `id`: short, letters/digits/`-`/`_`, unique. `label`: what the box says, at most two lines of 16 characters (about 30 characters). `kind`: one of the kinds below; it sets the icon and colour. `col` and `row`: whole numbers from 0 to 7, `col` 0 on the left, `row` 0 at the top; one node per cell. Optional: `"stack": true` draws the box as several copies (a fleet of identical servers); `"group": "Region A"` draws a dashed, labelled box around every node with that same group name (the group's nodes must form a block of cells that contains no other node).
- **Kinds:** `client` (browser, phone app, user), `dns`, `cdn`, `load-balancer`, `gateway` (API gateway), `service` (any app server), `worker` (background job), `cache`, `database`, `queue` (queue or stream), `blob-store` (object storage), `search` (search index), `external` (a third-party API; dashed border). Grey is the outside world, blue is networking, slate is compute, purple is data, amber is messaging.
- **Edges.** `from` and `to` are node ids; the arrow points at `to`. Optional: `label` (at most 22 characters, like `"GET /{code}"`), `"style": "async"` for a dashed line (a message that nobody waits for; a legend appears automatically), `"arrow": "both"` or `"none"`, `id` (only needed when two edges join the same two nodes in the same direction).
- **Layout rules that give clean pictures:**
  - Flow left to right: users in column 0, then the entry point, then services, then data stores on the right. Put a read path above and a write path below.
  - Use 3 to 4 columns. Each column is about 200px wide, so 4 columns fit the lesson column on a laptop; 5 or more make phone readers scroll sideways (the diagram scrolls inside its box, never the page, but it is still worse).
  - Leave a node's row empty between two things you want to connect around it, or the arrow has to bend around.
  - The build routes each arrow straight when two nodes share a row or column, and otherwise with right angles through the gaps between cells. It spreads several arrows on one side of a box and keeps parallel lines apart. If an arrow still passes through a box, the validator warns and names it: move a node, or set `"route"` on that edge to `"hv"` (sideways, then up or down), `"vh"` (up or down, then sideways), `"hvh"` (sideways, a jog in the column gap, sideways) or `"vhv"`.
  - If the validator says a label has no free spot, shorten it or spread the nodes.
- Show one idea per diagram. Twelve boxes is a lot; seven is usually right.

### 10.3 Stepping a request through the design: tracer `"arch"`

The key teaching device of the track: the reader clicks through a request (or a write, or a failure) moving through the system. Put the diagram once at the top of the tracer JSON as `"arch"` (same format as `<x-arch>`), then give each step an `"arch"` state saying what lights up.

```html
<x-tracer title="A read: cache hit, then a miss">
<script type="application/json">
{
  "arch": {
    "nodes": [
      { "id": "client", "label": "Browser", "kind": "client", "col": 0, "row": 1 },
      { "id": "app", "label": "App server", "kind": "service", "col": 1, "row": 1 },
      { "id": "cache", "label": "Cache", "kind": "cache", "col": 2, "row": 0 },
      { "id": "db", "label": "Database", "kind": "database", "col": 2, "row": 2 }
    ],
    "edges": [
      { "from": "client", "to": "app" },
      { "from": "app", "to": "cache" },
      { "from": "app", "to": "db" }
    ]
  },
  "steps": [
    {
      "caption": "The browser asks for product 42.",
      "arch": { "active": ["client", ["client", "app"]] }
    },
    {
      "caption": "The app asks the cache first. Miss.",
      "arch": { "active": ["cache", ["app", "cache"]], "notes": { "cache": "miss" } }
    },
    {
      "caption": "It reads the database, about 5 ms.",
      "arch": { "active": ["db", ["app", "db"]] },
      "vars": { "db reads": 1 }
    },
    {
      "caption": "The page goes back to the browser.",
      "arch": { "active": [["app", "client"]], "mark": ["client"] }
    },
    {
      "caption": "The cache node dies: every read now lands on the database.",
      "arch": { "fail": ["cache"], "active": ["db", ["app", "db"]], "notes": { "db": "4,000 reads/s" } }
    }
  ]
}
</script>
</x-tracer>
```

A step's `"arch"` may contain:

| Key | What it does |
|---|---|
| `active` | Accent colour: the boxes and arrows doing work in this step. Active arrows animate in their direction. |
| `mark` | Green: done, stored, answered. |
| `fail` | Red, dashed: a box that is down or an arrow that fails. A failed box gets a "down" tag unless you give a note. |
| `dim` | Faded: not involved right now. Arrows touching a dimmed box fade too. |
| `hide` | Not drawn in this step (for "now we add a cache" stories). Arrows touching a hidden box are hidden too. |
| `notes` | Small tags above boxes, `{"cache": "miss"}`, at most 16 characters each. |

- Each list holds node ids and arrows written as `["from", "to"]`. To show a reply travelling back, write the arrow backwards, `["app", "client"]`: the same arrow lights up and animates in reverse. An arrow with an `id` can also be named by its id.
- Steps do not inherit: list everything that should be lit in each step. A step with no `"arch"` shows the plain diagram.
- `vars` and `code` work as in any tracer; `vars` is good for counters ("db reads": 2) and latency totals.
- Use 6 to 12 steps per tracer. One tracer per story: "the read path", "the write path", "what happens when X dies". Every caption says why, with a number where you can ("about 5 ms", "4,000 a second land on a database sized for 400").

### 10.4 Estimation exercise: `<x-estimate>`

A back-of-the-envelope question the learner answers with a number and a unit. They see "within range", "too low" or "too high" (with how far off), and can open your worked arithmetic. Nothing is saved.

```html
<x-estimate title="Storage for five years">
<script type="application/json">
{
  "question": "How much storage do the link records need after five years?",
  "givens": ["100 million new links a month", "About 500 bytes per record", "Nothing is deleted"],
  "unit": "bytes",
  "answer": "3 TB",
  "accept": ["1 TB", "10 TB"],
  "steps": ["100 million × 12 × 5 = 6 billion links", "6 × 10<sup>9</sup> × 500 B = 3 × 10<sup>12</sup> B = 3 TB"],
  "note": "Optional: one sentence on what the number means for the design."
}
</script>
</x-estimate>
```

- `unit` is the family the learner picks from: `bytes` (B, KB, MB, GB, TB, PB, EB), `bytes/s` (B/s … TB/s), `count` (no unit, thousand, million, billion, trillion), `count/s` (`/s`, `thousand/s`, `million/s`, `billion/s`), `duration` (ms, seconds, minutes, hours, days, years). Units are powers of 1,000 (1 KB = 1,000 B), which is what interviews use.
- `answer` and both `accept` values are written as a number and a unit from that family: `"3 TB"`, `"6 billion"`, `"40 thousand/s"`, `"120 MB/s"`, `"20 minutes"`. Plain numbers like `"200/s"` or `"6,000"` work too.
- `accept` is the range you count as right. Estimates are rough: make it about 3x to 30x wide around the answer (the validator warns outside that).
- Optional `"choices"`: 3 to 5 answers, one order of magnitude apart, shown as buttons instead of the number box. Exactly one must fall inside `accept`. Use choices for quick "which order of magnitude?" checks; use the number box when the learner should do the arithmetic.
- `steps`: the worked arithmetic, one line per step, every number traceable to a given. `question`, `givens`, `steps` and `note` may contain inline HTML (`<sup>`, `<code>`).

### 10.5 Trade-off table: `<x-tradeoffs>`

Two to six options compared on the same three questions. On phones it becomes one card per option.

```html
<x-tradeoffs caption="Read and write strategies">
<script type="application/json">
{
  "options": [
    { "name": "Cache-aside", "good": "Simple; the app still works if the cache dies.", "bad": "Every write path must invalidate.", "pick": "Read-heavy data. The usual interview answer.", "default": true },
    { "name": "Write-through", "good": "Reads after a write are fresh.", "bad": "Slower writes.", "pick": "Data is read right after it is written." }
  ]
}
</script>
</x-tradeoffs>
```

- `name`, `good` ("Good at"), `bad` ("Bad at") and `pick` ("Pick it when") are required; inline HTML is allowed. Keep each cell to one or two short sentences.
- `"default": true` (at most one option) marks the usual choice with a "Usual default" badge. Leave it out when there is no usual answer.
- `caption` is optional.

### 10.6 Interview script: `<x-interview>`

A short exchange between the interviewer and the candidate, to show how to ask clarifying questions, state assumptions and narrate a trade-off. It looks different from `<x-prompt>` on purpose; never use `<x-prompt>` for interviews.

```html
<x-interview title="The first five minutes">
<x-interviewer>Design a URL shortener.</x-interviewer>
<x-you>Before I draw anything: can users pick a custom alias, and do links expire?</x-you>
<x-interviewer>Aliases yes, expiry optional.</x-interviewer>
<x-you>And roughly how many links a month, and how often is each one opened?</x-you>
<x-coach>Ask about features first, then scale. The numbers decide the design.</x-coach>
</x-interview>
```

- Children: `<x-interviewer>`, `<x-you>` and optional `<x-coach>` notes (a "Coach's note" aside that explains what the answer shows), in any order. At least one interviewer and one you turn.
- Turn text is normal HTML (`<code>`, `<strong>`, lists); plain text is wrapped in a paragraph for you. It counts as prose, so the voice rules apply.
- Optional `tone="strong"` or `tone="weak"` colours the "You" turns green or red and labels the block "Strong answer" / "Weak answer". Use a weak and a strong script in a pair to contrast two answers to the same question.
- Keep it to 3 to 7 turns. Write the way people talk in interviews: short, specific, with numbers.

### 10.7 "Your turn" step: `<x-tryit variant="turn">`

A staged step in a case study: the learner tries the next part of the design before reading it. It is the try-it box from 4.7 with a different label, a model-answer reveal, and an optional countdown timer.

```html
<x-tryit variant="turn" minutes="2" title="Model the data">
<x-task>
<p>Sketch the tables or records before reading on: what does one record hold, and how is it looked up?</p>
</x-task>
<x-answer>
<p>One record per code; every read is a lookup by code and nothing joins, so this is a key-value access pattern.</p>
</x-answer>
</x-tryit>
```

- `minutes` (optional, 1 to 15) adds a timer button. Use the time an interviewer would give you for that step: 2 for an API, 2 to 3 for a data model, 3 to 5 for a high-level sketch.
- The answer is short: the key decision and why. The full treatment follows in the next section, so do not repeat it.

### 10.8 Self-review checklist: `<x-checklist>`

A rubric the learner ticks after attempting the design. Ticks are saved in the browser, per lesson.

```html
<x-checklist title="Self-review: URL shortener">
<script type="application/json">
{
  "groups": [
    { "title": "Before drawing", "items": ["I asked about features before scale", "I got the read/write ratio"] },
    { "title": "Failure", "items": ["I said what breaks first at 10x"] }
  ]
}
</script>
</x-checklist>
```

- Use `"items": [...]` for a flat list or `"groups"` as above. 3 to 24 items in total; 10 to 14 is right for a case study.
- Write each item as something the learner did out loud, in the first person: "I estimated storage from arithmetic", not "Storage". Items are specific to the question; do not copy the URL shortener's list.

### 10.9 Quality bar: concept lesson

For building blocks and ideas (modules 1 to 4 and 7). In this order; headings are yours to word, except "In the interview".

1. **Hook: a concrete failure or scaling pain**, with numbers. "During a sale the product page does 4,000 reads a second and the database starts timing out." No heading before it.
2. **The idea in plain words**, before any mechanism. What it is, why it helps, what it costs.
3. **How it works**, with an `<x-arch>` diagram or an `<x-tracer>` with `"arch"` (usually both: a static diagram of where it sits, then a tracer of a request moving through it, including one step where something fails).
4. **The options and their trade-offs** in an `<x-tradeoffs>` table, then the details that matter (for caching: eviction, stampedes).
5. **Real numbers worth remembering**: a short list of rounded figures and an `<x-estimate>` that uses them.
6. **`<h2>In the interview</h2>`**: when to bring this up (which requirement or number triggers it); the exact phrases that show judgement ("Reads outnumber writes 100 to 1, so…"); an `<x-interview>`; and the follow-up questions interviewers ask, each with a short answer.
7. **Common mistakes**: at least one `<x-callout type="mistake">`.
8. **Quiz**: one `<x-quiz>`, 2 to 4 questions, at least one that needs a calculation or a choice between options.
9. **What to practise next**: one or two sentences linking to the next lessons and to a case study that uses this block. Then stop.

The validator warns if a concept lesson has no diagram or tracer, no `<x-tradeoffs>`, no mistake callout, no quiz, or no "In the interview" section.

### 10.10 Quality bar: case study (`"kind": "design"`)

Every case study follows the framework taught in `a-framework-for-any-design`, with **exactly these `<h2>` headings, in this order** (the validator enforces them; use `<h3>` inside a section):

1. Intro (no heading): one or two paragraphs on what the product does and why interviewers ask this question. Link to `/system-design/a-framework-for-any-design.html`.
2. `<h2>Clarify the problem</h2>`: an `<x-interview>` where you ask about features, scale and priorities; then a short list of **functional** requirements, **non-functional** requirements (latency, availability, durability, consistency, with numbers) and what is **out of scope**.
3. `<h2>Estimate the scale</h2>`: requests per second (average and peak), storage, bandwidth, memory for a cache, as needed, with the arithmetic shown. At least one `<x-estimate>`.
4. `<h2>Define the API</h2>`: the endpoints or messages, usually as `<x-code single>` with `lang="text"`, including error cases, plus the one API decision worth arguing (status codes, pagination, push vs pull).
5. `<h2>Model the data</h2>`: the records with fields and sizes (often `<x-code single>` with `lang="sql"`), the access patterns, and which category of database fits and why.
6. `<h2>High-level design</h2>`: an `<x-arch>` of the whole system, then an `<x-tracer>` with `"arch"` that walks the main **write path** and **read path** (one tracer for both, or one each).
7. `<h2>Deep dives</h2>`: the 2 to 4 hard parts interviewers push on, each as an `<h3>`. Each one states the problem, compares options (at least one `<x-tradeoffs>` in this section), and makes a justified choice.
8. `<h2>Bottlenecks and failures</h2>`: what breaks first at 10x and how you scale it; then what happens when each component dies (a table of component / what happens / what you do works well).
9. `<h2>What a strong answer sounds like</h2>`: what separates a junior, a mid-level and a senior answer to this question (a small table), and an `<x-interview>` showing one strong exchange.
10. `<h2>Follow-up questions</h2>`: about 5 questions interviewers ask after the main design, each as an `<h3>` with a two- or three-sentence answer.
11. An `<x-checklist>` self-review at the end. An optional last `<h2>What to practise next</h2>` may follow it.

Also required, and checked: an `<x-tryit variant="turn">` at the end of "Estimate the scale", "Define the API" and "Model the data", so the learner tries the API, the data model and the high-level design before reading each.

No quiz in case studies; the turn boxes and the checklist do that job.

### 10.11 Facts, numbers and names in this track

- All voice rules in section 2 apply.
- **Teach the category, not the vendor.** Name well-known technologies only as examples of a category: "a wide-column store such as Cassandra", "an in-memory cache such as Redis". The lesson must make sense with the names removed. No product comparisons, version numbers or pricing.
- **Numbers come from arithmetic on the page.** Use rounded, widely known orders of magnitude (memory read about 100 ns, a round trip in one data center about 0.5 ms, a disk seek about 10 ms) and derive everything else from the question's givens, showing the steps. Never state statistics about real companies ("X serves 2 billion users", "Y's cache hit rate is 99%"); invent a plausible scenario instead and say it is the scenario.
- Use the same numbers throughout a lesson: if the estimate says 4,000 reads a second, the tracer, the failure table and the quiz say 4,000 too. Recheck every number after editing.
- Round like an interviewer: 86,400 seconds a day is "about 100,000" for quick maths, but say so when you round.
- Be honest about trade-offs: every choice in a case study names what it costs.

### 10.12 Problems for the `system-design-blocks` topic

Practice problems for this topic implement one building block in plain code: a token-bucket or sliding-window rate limiter, a consistent-hash ring, an LRU cache with TTL, an ID generator, a weighted round-robin or least-connections balancer. They use the normal schema (section 6), usually as **design-a-class** problems (6.4) with `"pattern": "design"`, and `related` names the lesson slugs above (`rate-limiting`, `consistent-hashing`, `caching`, `unique-ids`, `load-balancing`). Time is an argument (`t` in seconds or milliseconds), never the real clock, so tests are deterministic.

# introtoalgo.com

Free lessons and practice for algorithms, system design and AI. Static site on GitHub Pages (repo root, custom domain in `CNAME`). No server, no CI: pages are generated locally and committed.

## Layout

```
content/                 source of truth (edit here)
  curriculum.json        tracks, modules, lesson order, practice topics, "start here" path
  algorithms/<slug>.html lessons (front matter + HTML with x-* components)
  system-design/<slug>.html
  ai/<slug>.html
  practice/<slug>.json   practice problems
  legacy/<name>.html     the original 2017 posts (re-wrapped into /posts/<name>.html)
  AUTHORING.md           the guide for writers: voice, formats, components, schema
tools/
  build.mjs              validate everything, then generate all pages + sitemap.xml
  check.mjs              validate content files (never writes to the repo)
  selftest.mjs           tests for the problem harness and validator
  serve.mjs              tiny static server for local preview
  lib/                   shared code (components, architecture diagrams, highlighter, layout, schema)
assets/
  css/site.css           the only stylesheet
  js/                    small ES modules, one per page type; harness.js is shared with Node
  js/runner/             Web Workers that run learner code (JS, Python via Pyodide) + harness.py
  vendor/codemirror/     bundled CodeMirror 6 (see README.txt there)
index.html, about.html, archive.html, 404.html, algorithms/, system-design/, ai/, practice/, posts/, sitemap.xml
                         GENERATED. Do not edit by hand.
algos.html, generic.html, category.html
                         generated redirects from old URLs
```

## Commands

Node 22 and python3 are needed. No `npm install`.

```bash
node tools/check.mjs [files or folders…]   # validate (all content if no args); --no-run skips running code
node tools/build.mjs                        # validate, then regenerate the site (idempotent)
node tools/serve.mjs 8000                   # preview at http://localhost:8000
node tools/selftest.mjs                     # harness, validator and AUTHORING.md snippet self-test
```

`python3 -m http.server 8000` also works for previewing, but `tools/serve.mjs` serves `404.html` like GitHub Pages does.

## Adding content

Read `content/AUTHORING.md` (section 10 covers the system design track). In short: add a lesson file named after a slug in `curriculum.json`, or a problem JSON file; run `node tools/check.mjs <file>`; then run the build and commit the generated pages with the source.

Python in the practice workspace loads Pyodide lazily from `cdn.jsdelivr.net/npm/pyodide@314.0.7/`. To test against a local copy, set `localStorage['ia:pyodide-base']` to a URL that serves the npm `pyodide` package (for example `/node_modules/pyodide/` after `npm i pyodide@314.0.7`; `node_modules` is gitignored).

Analytics (Google Analytics) and AdSense tags are injected on every page by `tools/lib/layout.mjs`.

Maintained by [Sarvesh Bhatnagar](https://www.sarveshbhatnagar.com).

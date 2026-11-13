#!/usr/bin/env node
// Build the whole site from content/ into static HTML at the repo root.
//
//   node tools/build.mjs            validate everything, then generate
//   node tools/build.mjs --no-run   skip running problem solutions (faster)
//
// Generated (and committed): index.html, about.html, archive.html, 404.html,
// algorithms/*, ai/*, practice/*, posts/*.html, redirect pages, sitemap.xml.
// Idempotent: same content in, same bytes out.
import { writeFileSync, mkdirSync, readFileSync, existsSync, readdirSync, rmSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { ROOT, CONTENT, SITE, esc, stripTags, loadCurriculum, listFiles, parseFrontMatter } from './lib/util.mjs';
import { checkAll } from './check.mjs';
import { checkLessonFile, makeLinkResolver, legacySlugs } from './lib/lessons.mjs';
import { checkProblemFile, runtimeMeta, allTests, H } from './lib/problems.mjs';
import { icon, renderCode, renderTracer } from './lib/components.mjs';
import { page, redirectPage, breadcrumbLd } from './lib/layout.mjs';

const args = new Set(process.argv.slice(2));
const run = !args.has('--no-run');

/* ---------------------------------------------------------------------- */
/* 1. validate                                                             */
/* ---------------------------------------------------------------------- */
console.log('Validating content…');
const check = checkAll([], { run, quiet: true });
if (check.errors) {
  console.error('\nBuild stopped: fix the errors above first.');
  process.exit(1);
}

const cur = loadCurriculum();
const resolveLink = makeLinkResolver(cur);
const written = [];
const sitemap = [];

function out(rel, html, { inSitemap = true } = {}) {
  const file = join(ROOT, rel);
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, html);
  written.push(rel);
  if (inSitemap) sitemap.push(rel === 'index.html' ? '/' : '/' + rel.replace(/index\.html$/, ''));
}

// Generated directories are wiped first so removed content disappears.
for (const d of ['algorithms', 'ai', 'practice']) rmSync(join(ROOT, d), { recursive: true, force: true });

/* ---------------------------------------------------------------------- */
/* 2. load content                                                         */
/* ---------------------------------------------------------------------- */
const lessons = new Map(); // slug -> {front, body, info}
for (const track of cur.tracks) {
  for (const info of track.allLessons) {
    if (!info.exists) continue;
    const r = checkLessonFile(info.file, cur, resolveLink);
    lessons.set(info.slug, { ...r, info });
  }
}

const problems = listFiles(join(CONTENT, 'practice'), '.json')
  .map((f) => checkProblemFile(join(CONTENT, 'practice', f), cur, { run: false }).problem)
  .filter(Boolean);
const topicOrder = [...cur.topics.keys()];
problems.sort((a, b) => topicOrder.indexOf(a.topic) - topicOrder.indexOf(b.topic) || a.order - b.order || a.title.localeCompare(b.title));
const problemBySlug = new Map(problems.map((p) => [p.slug, p]));

const legacy = legacySlugs()
  .map((slug) => {
    const fm = parseFrontMatter(readFileSync(join(CONTENT, 'legacy', slug + '.html'), 'utf8'));
    return { slug, ...fm.data, body: fm.body.trim() };
  })
  .sort((a, b) => b.date.localeCompare(a.date));

// lesson slug -> legacy posts that relate to it
const legacyFor = new Map();
for (const p of legacy) for (const s of p.related || []) (legacyFor.get(s) || legacyFor.set(s, []).get(s)).push(p);
for (const [slug, l] of lessons) for (const s of l.front.legacy || []) {
  const p = legacy.find((x) => x.slug === s);
  const list = legacyFor.get(slug) || legacyFor.set(slug, []).get(slug);
  if (p && !list.includes(p)) list.push(p);
}

// "Practice this": problems naming the lesson in `related`, then the rest of the lesson's topics.
function practiceFor(slug) {
  const direct = problems.filter((p) => p.related.includes(slug));
  const topics = cur.practiceTopics.filter((t) => t.lessons.includes(slug)).map((t) => t.id);
  const extra = problems.filter((p) => topics.includes(p.topic) && !direct.includes(p));
  return [...direct, ...extra].slice(0, 6);
}

const TRACK_ICON = { algorithms: 'graph', ai: 'brain', practice: 'code' };
const DIFF_LABEL = { easy: 'Easy', medium: 'Medium', hard: 'Hard' };
const diffBadge = (d) => `<span class="diff diff--${d}">${DIFF_LABEL[d]}</span>`;
const statusDot = (slug) => `<span class="pstatus" data-pstatus="${slug}" aria-hidden="true"></span>`;

/* ---------------------------------------------------------------------- */
/* 3. lesson pages                                                         */
/* ---------------------------------------------------------------------- */
function lessonPage(l) {
  const { info, front, body } = l;
  const track = info.trackObj;
  const mod = info.module;
  const existing = track.allLessons.filter((x) => lessons.has(x.slug));
  const pos = existing.findIndex((x) => x.slug === info.slug);
  const prev = existing[pos - 1], next = existing[pos + 1];
  const key = `${track.id}/${info.slug}`;

  const side = `<nav class="lnav" aria-label="${esc(track.title)} lessons">
  <a class="lnav__track" href="${track.path}">${icon(TRACK_ICON[track.id])}<span>${esc(track.title)} roadmap</span></a>
  <details class="lnav__details" open>
    <summary><span class="lnav__mod">Module ${mod.number}</span> ${esc(mod.title)}</summary>
    <ol class="lnav__list">${mod.lessons
      .map((ls) => {
        const ex = lessons.has(ls.slug);
        const cls = ls.slug === info.slug ? ' is-current' : '';
        const inner = `<span class="lstatus" data-lstatus="${track.id}/${ls.slug}" aria-hidden="true"></span><span>${esc(ls.title)}</span>`;
        return ex ? `<li><a class="lnav__item${cls}" href="${track.path}${ls.slug}.html"${ls.slug === info.slug ? ' aria-current="page"' : ''}>${inner}</a></li>` : `<li><span class="lnav__item is-soon">${inner}<span class="soon">Soon</span></span></li>`;
      })
      .join('')}</ol>
  </details>
</nav>`;

  const tocList = body.toc.map((t) => `<li><a href="#${t.id}">${esc(t.text)}</a></li>`).join('');
  const practice = track.id === 'algorithms' || practiceFor(info.slug).length ? practiceFor(info.slug) : [];
  const practiceHtml = practice.length
    ? `<section class="endcard endcard--practice"><h2 class="endcard__title">${icon('code')}Practice this</h2><ul class="plist plist--compact">${practice
        .map((p) => `<li class="plist__row">${statusDot(p.slug)}<a href="/practice/${p.slug}.html" class="plist__title">${esc(p.title)}</a><span class="plist__pattern">${esc(p.pattern)}</span>${diffBadge(p.difficulty)}</li>`)
        .join('')}</ul></section>`
    : track.id === 'algorithms'
      ? `<section class="endcard endcard--practice"><h2 class="endcard__title">${icon('code')}Practice this</h2><p class="muted">Problems for this lesson are on the way. Meanwhile, <a href="/practice/">browse all practice problems</a>.</p></section>`
      : '';
  const leg = legacyFor.get(info.slug) || [];
  const legacyHtml = leg.length
    ? `<section class="endcard"><h2 class="endcard__title">${icon('book')}From the archive</h2><ul class="archive-mini">${leg.map((p) => `<li><a href="/posts/${p.slug}.html">${esc(p.title)}</a> <span class="muted">${esc(p.dateLabel)}</span></li>`).join('')}</ul></section>`
    : '';
  const pager = `<nav class="pager" aria-label="Lesson navigation">${prev ? `<a class="pager__link pager__link--prev" href="${track.path}${prev.slug}.html"><span class="pager__dir">${icon('prev')}Previous</span><span class="pager__title">${esc(prev.title)}</span></a>` : '<span></span>'}${next ? `<a class="pager__link pager__link--next" href="${track.path}${next.slug}.html"><span class="pager__dir">Next${icon('next')}</span><span class="pager__title">${esc(next.title)}</span></a>` : `<a class="pager__link pager__link--next" href="${track.path}"><span class="pager__dir">Done${icon('next')}</span><span class="pager__title">Back to the roadmap</span></a>`}</nav>`;

  const main = `<div class="lesson-layout">
<aside class="lesson-layout__side">${side}</aside>
<article class="lesson" data-lesson="${key}" data-title="${esc(front.title)}">
  <header class="lesson__head">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="${track.path}">${esc(track.title)}</a><span aria-hidden="true">/</span><span>Module ${mod.number}: ${esc(mod.title)}</span></nav>
    <h1 class="lesson__title">${esc(front.title)}</h1>
    <p class="lesson__lead">${esc(front.description)}</p>
    <div class="lesson__meta"><span>${icon('clock')}${front.minutes} min</span><span>Lesson ${info.indexInModule + 1} of ${mod.lessons.length}</span><span class="lesson__done" data-done-badge hidden>${icon('check')}Completed</span></div>
  </header>
  ${body.toc.length ? `<details class="toc-inline"><summary>On this page</summary><ol>${tocList}</ol></details>` : ''}
  <div class="prose">
${body.html.trim()}
  </div>
  <footer class="lesson__end">
    <div class="complete">
      <button type="button" class="btn btn--accent complete__btn" data-complete>${icon('check')}<span data-complete-label>Mark lesson complete</span></button>
      <p class="complete__note muted">Progress is saved in this browser only.</p>
    </div>
    ${practiceHtml}
    ${legacyHtml}
    ${pager}
  </footer>
</article>
<aside class="lesson-layout__toc">${body.toc.length ? `<nav class="toc" aria-label="On this page"><h2 class="toc__title">On this page</h2><ol>${tocList}</ol></nav>` : ''}</aside>
</div>`;

  return page({
    title: front.title,
    fullTitle: `${front.title} | ${track.title} | introtoalgo`,
    description: front.description,
    path: info.url,
    track: track.id,
    main,
    ogType: 'article',
    scripts: ['/assets/js/lesson.js'],
    jsonLd: [
      { '@context': 'https://schema.org', '@type': 'LearningResource', name: front.title, description: front.description, url: SITE + info.url, timeRequired: `PT${front.minutes}M`, learningResourceType: 'Lesson', isPartOf: { '@type': 'Course', name: `${track.title} on introtoalgo`, url: SITE + track.path }, author: { '@type': 'Person', name: 'Sarvesh Bhatnagar', url: 'https://www.sarveshbhatnagar.com' } },
      breadcrumbLd([{ name: 'Home', path: '/' }, { name: track.title, path: track.path }, { name: front.title, path: info.url }]),
    ],
  });
}

/* ---------------------------------------------------------------------- */
/* 4. roadmap pages                                                        */
/* ---------------------------------------------------------------------- */
function roadmapPage(track) {
  const total = track.allLessons.length;
  const live = track.allLessons.filter((l) => lessons.has(l.slug)).length;
  const firstLive = track.allLessons.find((l) => lessons.has(l.slug));
  const mods = track.modules
    .map((m) => {
      const rows = m.lessons
        .map((ls) => {
          const l = lessons.get(ls.slug);
          const key = `${track.id}/${ls.slug}`;
          return l
            ? `<li class="rm-lesson"><a href="${track.path}${ls.slug}.html" class="rm-lesson__link"><span class="lstatus" data-lstatus="${key}" aria-hidden="true"></span><span class="rm-lesson__title">${esc(ls.title)}</span><span class="rm-lesson__min">${l.front.minutes} min</span></a></li>`
            : `<li class="rm-lesson is-soon"><span class="rm-lesson__link"><span class="lstatus" aria-hidden="true"></span><span class="rm-lesson__title">${esc(ls.title)}</span><span class="soon">Coming soon</span></span></li>`;
        })
        .join('');
      const keys = m.lessons.filter((ls) => lessons.has(ls.slug)).map((ls) => `${track.id}/${ls.slug}`);
      return `<li class="rm-module" id="${m.id}">
  <div class="rm-module__rail" aria-hidden="true"><span class="rm-module__num">${m.number}</span></div>
  <div class="rm-module__body">
    <div class="rm-module__head"><h2 class="rm-module__title">${esc(m.title)}</h2><span class="rm-module__count" data-mod-progress="${keys.join(' ')}" data-mod-total="${m.lessons.length}">${m.lessons.length} lessons</span></div>
    <p class="rm-module__summary">${esc(m.summary)}</p>
    <ol class="rm-lessons">${rows}</ol>
  </div>
</li>`;
    })
    .join('\n');
  const keysAll = track.allLessons.filter((l) => lessons.has(l.slug)).map((l) => `${track.id}/${l.slug}`);
  const main = `<div class="wrap">
<header class="page-hero page-hero--${track.id}">
  <p class="eyebrow">${icon(TRACK_ICON[track.id])}${track.id === 'ai' ? 'AI track' : 'Algorithms track'}</p>
  <h1 class="page-hero__title">${esc(track.title === 'AI' ? 'AI, from how it works to how to use it' : 'Algorithms & data structures')}</h1>
  <p class="page-hero__lead">${esc(track.description)}</p>
  <div class="progress-block" data-track-progress="${keysAll.join(' ')}" data-total="${total}">
    <div class="progress-block__row"><span class="progress-block__label"><strong data-progress-done>0</strong> of ${total} lessons complete</span><span class="muted">${live} published · ${track.modules.length} modules</span></div>
    <div class="bar" role="progressbar" aria-label="Track progress" aria-valuemin="0" aria-valuemax="${total}" aria-valuenow="0"><span class="bar__fill" style="width:0%"></span></div>
    <div class="progress-block__cta">${firstLive ? `<a class="btn btn--accent" href="${firstLive.url}" data-continue-track="${track.id}">${icon('arrow')}<span>Start with ${esc(firstLive.title)}</span></a>` : ''}<a class="btn btn--ghost" href="/practice/">Practice problems</a></div>
  </div>
  <div class="order-note">${icon('flag')}<p><strong>Recommended order.</strong> ${esc(track.order)}</p></div>
</header>
<ol class="roadmap">
${mods}
</ol>
</div>`;
  return page({
    title: track.title === 'AI' ? 'AI Roadmap: Machine Learning, LLMs, Prompting and Agents' : 'Algorithms Roadmap: Data Structures and Algorithms',
    description: track.tagline + ' Free, step-by-step lessons with code in JavaScript and Python.',
    path: track.path,
    track: track.id,
    main,
    scripts: ['/assets/js/roadmap.js'],
    jsonLd: {
      '@context': 'https://schema.org', '@type': 'Course', name: `${track.title} on introtoalgo`, description: track.description, url: SITE + track.path,
      provider: { '@type': 'Organization', name: 'introtoalgo', url: SITE },
      hasPart: track.allLessons.filter((l) => lessons.has(l.slug)).map((l) => ({ '@type': 'LearningResource', name: l.title, url: SITE + l.url })),
    },
  });
}

/* ---------------------------------------------------------------------- */
/* 5. practice pages                                                       */
/* ---------------------------------------------------------------------- */
function argsBlock(p, c) {
  return `<pre class="io">${esc(H.formatArgs(p, c))}</pre>`;
}

function problemPage(p) {
  const topic = cur.topics.get(p.topic);
  const design = !!p.signature.class;
  const examples = p.examples
    .map((e, i) => `<div class="example"><div class="example__head">Example ${i + 1}</div>
<div class="example__io"><div><span class="example__k">Input</span>${argsBlock(p, e)}</div><div><span class="example__k">Output</span><pre class="io">${esc(H.formatValue(e.expected))}</pre></div></div>
<div class="example__why"><span class="example__k">Why</span>${/^\s*</.test(e.explanation) ? e.explanation : `<p>${e.explanation}</p>`}</div></div>`)
    .join('');
  const hints = p.hints
    .map((h, i) => `<li class="hint" data-hint="${i}" hidden><span class="hint__n">Hint ${i + 1}</span><div class="hint__body">${/^\s*</.test(h) ? h : `<p>${h}</p>`}</div></li>`)
    .join('');
  const related = p.related.map((s) => cur.lessons.get(s)).filter(Boolean);
  const relatedHtml = related
    .map((l) => (lessons.has(l.slug) ? `<a class="chip" href="${l.url}">${icon('book')}${esc(l.title)}</a>` : `<span class="chip chip--soon">${icon('book')}${esc(l.title)} <span class="soon">Soon</span></span>`))
    .join('');
  const sigText = design
    ? `class ${p.signature.class}`
    : `${p.signature.function}(${p.signature.params.map((x) => `${x.name}: ${x.type}`).join(', ')}) → ${p.mutates ? `void (changes ${p.mutates} in place)` : p.signature.returns}`;
  const data = {
    ...runtimeMeta(p),
    title: p.title,
    starter: p.starter,
    pyName: H.entryName(p.signature, 'py'),
    refJs: p.solution.js,
    tests: allTests(p).map((t, i) => ({ ...t, example: i < p.examples.length })),
  };
  const compareNote = { exact: '', unordered: 'Any order of the returned list is accepted.', approx: 'Numbers are accepted within 1e-6.', checker: 'Several answers can be correct; any valid one is accepted.' }[p.compare];
  const solution = `<section class="solution" id="solution" data-solution>
  <div class="solution__lock" data-solution-lock>
    ${icon('lock')}
    <div><h2>Walkthrough and solution</h2><p>Unlocks when you pass every test. Stuck for a while? Looking is fine too, as long as you then close it and write the code yourself.</p></div>
    <button type="button" class="btn btn--ghost" data-giveup>I give up, show me</button>
  </div>
  <div class="solution__body" data-solution-body hidden>
    <h2>${icon('sparkle')}How to solve it</h2>
    <div class="prose-ui">${p.solution.walkthrough}</div>
    ${renderCode([{ lang: 'js', code: p.solution.js }, { lang: 'py', code: p.solution.py }], { title: 'Reference solution' })}
    <div class="cx cx--badges"><div class="cx__item"><span class="cx__k">Time</span><span class="bigo">${esc(p.solution.time)}</span><span class="cx__why">${p.solution.timeWhy}</span></div><div class="cx__item"><span class="cx__k">Space</span><span class="bigo">${esc(p.solution.space)}</span><span class="cx__why">${p.solution.spaceWhy}</span></div></div>
    <aside class="callout callout--key"><div class="callout__head">${icon('key')}<span>What to take away</span></div><div class="callout__body">${/^\s*</.test(p.solution.takeaway) ? p.solution.takeaway : `<p>${p.solution.takeaway}</p>`}</div></aside>
  </div>
</section>`;

  const main = `<div class="ws" data-problem="${p.slug}">
<section class="ws__problem" aria-label="Problem">
  <div class="ws__scroll">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="/practice/">Practice</a><span aria-hidden="true">/</span><a href="/practice/#${p.topic}">${esc(topic.title)}</a></nav>
    <h1 class="ws__title">${statusDot(p.slug)}${esc(p.title)}</h1>
    <div class="ws__badges">${diffBadge(p.difficulty)}<span class="tag">${esc(p.pattern)}</span>${p.aka ? `<span class="aka">Also known as <strong>${esc(p.aka)}</strong></span>` : ''}</div>
    <div class="prose-ui ws__story">${p.story}</div>
    <h2 class="ws__h">Your task</h2>
    <div class="prose-ui">${p.task}</div>
    <p class="sig"><code>${esc(sigText)}</code>${compareNote ? `<span class="muted"> ${compareNote}</span>` : ''}</p>
    <h2 class="ws__h">Examples</h2>
    ${examples}
    <h2 class="ws__h">Constraints</h2>
    <ul class="constraints">${p.constraints.map((c) => `<li>${esc(c)}</li>`).join('')}</ul>
    <details class="brute"><summary>${icon('bolt')}Start with brute force</summary><div class="prose-ui">${p.bruteForce}</div></details>
    <section class="hints" data-hints aria-label="Hints">
      <div class="hints__head"><h2 class="ws__h">${icon('hint')}Hints</h2><span class="muted" data-hint-count>0 of ${p.hints.length} shown</span></div>
      <ol class="hints__list">${hints}</ol>
      <button type="button" class="btn btn--ghost btn--sm" data-hint-next>Show hint 1</button>
    </section>
    ${solution}
    ${related.length ? `<div class="ws__related"><span class="muted">Learn the idea:</span> ${relatedHtml}</div>` : ''}
  </div>
</section>
<section class="ws__code" aria-label="Code">
  <div class="ws__toolbar">
    <div class="seg" role="group" aria-label="Language">
      <button type="button" class="seg__btn" data-ws-lang="js" aria-pressed="true">JavaScript</button>
      <button type="button" class="seg__btn" data-ws-lang="py" aria-pressed="false">Python</button>
    </div>
    <span class="ws__save muted" data-save-state></span>
    <button type="button" class="btn-icon" data-reset title="Reset to starter code" aria-label="Reset to starter code">${icon('reset')}</button>
  </div>
  <div class="editor" data-editor><textarea class="editor__fallback" aria-label="Code editor" spellcheck="false" data-editor-fallback>${esc(p.starter.js)}</textarea></div>
  <div class="ws__actions">
    <button type="button" class="btn btn--ghost" data-run>${icon('play')}Run examples</button>
    <button type="button" class="btn btn--accent" data-submit>${icon('check')}Submit</button>
    <button type="button" class="btn-text" data-custom-toggle aria-expanded="false">Custom input</button>
    <span class="ws__kbd muted"><kbd>Ctrl</kbd>+<kbd>Enter</kbd> runs</span>
  </div>
  <div class="custom" data-custom hidden>
    <label for="custom-input">Arguments as JSON, one per line${design ? ' (first line: ops list, second line: args list)' : ''}</label>
    <textarea id="custom-input" class="custom__input" rows="3" spellcheck="false" data-custom-input>${esc(design ? `${JSON.stringify(p.examples[0].ops)}\n${JSON.stringify(p.examples[0].args)}` : p.examples[0].args.map((a) => JSON.stringify(a)).join('\n'))}</textarea>
    <button type="button" class="btn btn--ghost btn--sm" data-custom-run>Run with this input</button>
  </div>
  <div class="results" data-results aria-live="polite">
    <p class="results__empty muted">Run your code to see results here. <strong>Run</strong> checks the examples. <strong>Submit</strong> checks every test, including hidden edge cases.</p>
  </div>
</section>
</div>
<script type="application/json" id="problem-data">${JSON.stringify(data).replace(/</g, '\\u003c')}</script>`;

  return page({
    title: `${p.title}${p.aka ? ` (${p.aka})` : ''}`,
    fullTitle: `${p.title}${p.aka ? ` (${p.aka})` : ''}: ${DIFF_LABEL[p.difficulty]} ${p.pattern} problem | introtoalgo`,
    description: stripTags(p.story).slice(0, 150).replace(/\s+\S*$/, '') + '…',
    path: `/practice/${p.slug}.html`,
    track: 'practice',
    bodyClass: 'is-workspace',
    main,
    scripts: ['/assets/js/workspace.js'],
    jsonLd: breadcrumbLd([{ name: 'Home', path: '/' }, { name: 'Practice', path: '/practice/' }, { name: p.title, path: `/practice/${p.slug}.html` }]),
  });
}

function practiceIndex() {
  const patterns = [...new Set(problems.map((p) => p.pattern))].sort();
  const counts = { easy: 0, medium: 0, hard: 0 };
  problems.forEach((p) => counts[p.difficulty]++);
  const groups = cur.practiceTopics
    .map((t) => {
      const ps = problems.filter((p) => p.topic === t.id);
      const lessonsLinks = t.lessons
        .map((s) => cur.lessons.get(s))
        .filter((l) => l && lessons.has(l.slug))
        .slice(0, 4)
        .map((l) => `<a href="${l.url}">${esc(l.title)}</a>`)
        .join(', ');
      return `<section class="ptopic" id="${t.id}" data-topic-section="${t.id}">
  <div class="ptopic__head"><h2 class="ptopic__title">${esc(t.title)}</h2><span class="ptopic__count muted" data-topic-count="${t.id}">${ps.length ? `${ps.length} problem${ps.length === 1 ? '' : 's'}` : 'Coming soon'}</span></div>
  <p class="ptopic__summary muted">${esc(t.summary)}${lessonsLinks ? ` Learn it first: ${lessonsLinks}.` : ''}</p>
  ${ps.length ? `<ul class="plist">${ps
    .map((p) => `<li class="plist__row" data-prob data-slug="${p.slug}" data-topic="${p.topic}" data-difficulty="${p.difficulty}" data-pattern="${esc(p.pattern)}" data-search="${esc((p.title + ' ' + (p.aka || '') + ' ' + p.pattern).toLowerCase())}">${statusDot(p.slug)}<a class="plist__title" href="/practice/${p.slug}.html">${esc(p.title)}</a>${p.aka ? `<span class="plist__aka">${esc(p.aka)}</span>` : '<span class="plist__aka"></span>'}<span class="plist__pattern">${esc(p.pattern)}</span>${diffBadge(p.difficulty)}</li>`)
    .join('')}</ul>` : '<p class="ptopic__empty">Problems for this topic are being written.</p>'}
</section>`;
    })
    .join('\n');
  const main = `<div class="wrap">
<header class="page-hero page-hero--practice">
  <p class="eyebrow">${icon('code')}Practice</p>
  <h1 class="page-hero__title">Solve problems in your browser</h1>
  <p class="page-hero__lead">Every problem starts as a small story, gives you hints one at a time, and runs your JavaScript or Python against real tests. Nothing to install.</p>
  <div class="pstats" data-pstats data-total="${problems.length}" data-easy="${counts.easy}" data-medium="${counts.medium}" data-hard="${counts.hard}">
    <div class="pstats__main"><span class="pstats__num" data-pstat="solved">0</span><span class="pstats__of">/ ${problems.length} solved</span></div>
    <div class="pstats__bars">
      ${['easy', 'medium', 'hard'].map((d) => `<div class="pstats__row"><span class="diff diff--${d}">${DIFF_LABEL[d]}</span><div class="bar bar--${d}"><span class="bar__fill" data-pstat-bar="${d}" style="width:0%"></span></div><span class="muted"><span data-pstat="${d}">0</span>/${counts[d]}</span></div>`).join('')}
    </div>
  </div>
</header>
<form class="filters" role="search" data-filters onsubmit="return false">
  <label class="filters__search">${icon('search')}<span class="sr-only">Search problems</span><input type="search" placeholder="Search by name or pattern" data-f="q" autocomplete="off"></label>
  <label><span class="sr-only">Topic</span><select data-f="topic"><option value="">All topics</option>${cur.practiceTopics.map((t) => `<option value="${t.id}">${esc(t.title)}</option>`).join('')}</select></label>
  <label><span class="sr-only">Pattern</span><select data-f="pattern"><option value="">All patterns</option>${patterns.map((p) => `<option value="${esc(p)}">${esc(p)}</option>`).join('')}</select></label>
  <label><span class="sr-only">Status</span><select data-f="status"><option value="">Any status</option><option value="todo">To do</option><option value="attempted">Attempted</option><option value="solved">Solved</option></select></label>
  <div class="seg seg--sm" role="group" aria-label="Difficulty">
    <button type="button" class="seg__btn" data-f-diff="" aria-pressed="true">All</button>
    ${['easy', 'medium', 'hard'].map((d) => `<button type="button" class="seg__btn" data-f-diff="${d}" aria-pressed="false">${DIFF_LABEL[d]}</button>`).join('')}
  </div>
</form>
<p class="filters__result muted" data-filter-result aria-live="polite"></p>
${groups}
</div>`;
  return page({
    title: 'Practice Problems: Algorithms and ML in JavaScript and Python',
    description: `${problems.length} practice problems on arrays, trees, graphs, dynamic programming and ML from scratch. Hints, tests and walkthroughs, right in your browser.`,
    path: '/practice/',
    track: 'practice',
    main,
    scripts: ['/assets/js/practice.js'],
  });
}

/* ---------------------------------------------------------------------- */
/* 6. home, about, archive, 404, legacy                                    */
/* ---------------------------------------------------------------------- */
const HERO_TRACER = {
  steps: [
    { caption: 'Sorted prices, budget 14. Put one finger on each end.', array: { label: 'prices', values: [1, 3, 4, 6, 9, 11], pointers: { L: 0, R: 5 }, highlight: [0, 5] }, vars: { sum: 12, budget: 14 } },
    { caption: '12 is too small. Only moving L can make the sum bigger.', array: { label: 'prices', values: [1, 3, 4, 6, 9, 11], pointers: { L: 1, R: 5 }, highlight: [1, 5], dim: [0] }, vars: { sum: 14, budget: 14 } },
    { caption: '3 + 11 = 14. Found it in two steps, not fifteen.', array: { label: 'prices', values: [1, 3, 4, 6, 9, 11], pointers: { L: 1, R: 5 }, mark: [1, 5], dim: [0] }, vars: { sum: 14, budget: 14 } },
  ],
};

function homePage() {
  const algo = cur.tracks.find((t) => t.id === 'algorithms'), ai = cur.tracks.find((t) => t.id === 'ai');
  const liveCount = (t) => t.allLessons.filter((l) => lessons.has(l.slug)).length;
  const keys = (t) => t.allLessons.filter((l) => lessons.has(l.slug)).map((l) => `${t.id}/${l.slug}`).join(' ');
  const door = (id, href, title, text, points, stat, progressAttr) => `<a class="door door--${id}" href="${href}">
  <span class="door__icon">${icon(TRACK_ICON[id])}</span>
  <span class="door__title">${title}</span>
  <span class="door__text">${text}</span>
  <ul class="door__points">${points.map((p) => `<li>${p}</li>`).join('')}</ul>
  <span class="door__foot"><span class="door__stat">${stat}</span><span class="door__go">${icon('arrow')}</span></span>
  ${progressAttr ? `<span class="door__bar bar" ${progressAttr}><span class="bar__fill" style="width:0%"></span></span>` : ''}
</a>`;
  const startItems = cur.startHere
    .map((s, i) => {
      let href = null, title = '', kind = '';
      if (s.kind === 'lesson') {
        const l = cur.lessons.get(s.slug);
        title = l ? l.title : s.slug;
        href = l && lessons.has(l.slug) ? l.url : null;
        kind = l && l.track === 'ai' ? 'AI lesson' : 'Lesson';
      } else {
        const p = problemBySlug.get(s.slug);
        title = p ? p.title : s.slug;
        href = p ? `/practice/${p.slug}.html` : null;
        kind = 'Problem';
      }
      const inner = `<span class="path__n">${i + 1}</span><span class="path__body"><span class="path__kind">${kind}</span><span class="path__title">${esc(title)}</span><span class="path__note">${esc(s.note)}</span></span>`;
      return href ? `<li><a class="path__item" href="${href}">${inner}</a></li>` : `<li><span class="path__item is-soon">${inner}<span class="soon">Soon</span></span></li>`;
    })
    .join('');

  const main = `<div class="wrap">
<section class="hero">
  <div class="hero__text">
    <p class="eyebrow">${icon('terminal')}Free. No sign-up. Runs in your browser.</p>
    <h1 class="hero__title">Learn algorithms and AI <span class="hero__hl">by working through them.</span></h1>
    <p class="hero__lead">Lessons you can step through one move at a time, problems you solve and test right here, and a plain-spoken guide to how AI works and how to use it well.</p>
    <div class="hero__cta"><a class="btn btn--accent btn--lg" href="#start">${icon('flag')}Start here</a><a class="btn btn--ghost btn--lg" href="/practice/">Jump into practice</a></div>
  </div>
  <div class="hero__demo" aria-label="Example of a step-through lesson">
    ${renderTracer(HERO_TRACER, 'Two pointers, step by step').replace('data-tracer', 'data-tracer data-autoplay')}
  </div>
</section>

<section class="continue" data-continue hidden aria-labelledby="continue-h">
  <h2 class="section-label" id="continue-h">Pick up where you left off</h2>
  <ul class="continue__list" data-continue-list></ul>
</section>

<section class="doors" aria-label="Sections">
  ${door('algorithms', '/algorithms/', 'Algorithms', 'From Big-O to dynamic programming, one concrete example at a time.', ['Step-through traces of every idea', 'Code in JavaScript and Python', 'Quick checks as you go'], `${liveCount(algo)} of ${algo.allLessons.length} lessons · ${algo.modules.length} modules`, `data-track-progress="${keys(algo)}" data-total="${algo.allLessons.length}"`)}
  ${door('practice', '/practice/', 'Practice', 'Problems like the ones in interviews, told as small stories, with hints that teach.', ['Hints revealed one at a time', 'Run and submit in the browser', 'Walkthroughs after you solve'], `${problems.length} problems · ${cur.practiceTopics.length} topics`, `data-practice-progress data-total="${problems.length}"`)}
  ${door('ai', '/ai/', 'AI', 'How machine learning and LLMs work, then the craft of prompting, context and agents.', ['No hype, no vendor lock-in', 'Rewrite real prompts yourself', 'Habits for checking AI output'], `${liveCount(ai)} of ${ai.allLessons.length} lessons · ${ai.modules.length} modules`, `data-track-progress="${keys(ai)}" data-total="${ai.allLessons.length}"`)}
</section>

<section class="start" id="start" aria-labelledby="start-h">
  <div class="start__intro">
    <h2 class="section-title" id="start-h">New here? Start with these five.</h2>
    <p>About an hour in total. You will learn how to measure code, use the most useful data structure there is, solve a real problem in the browser, and write better prompts.</p>
  </div>
  <ol class="path">${startItems}</ol>
</section>

<section class="how" aria-labelledby="how-h">
  <h2 class="section-title" id="how-h">How it works</h2>
  <div class="how__grid">
    <div class="how__item">${icon('target')}<h3>See it move</h3><p>Every algorithm comes with a tracer. Click Next and watch the pointers, the table, the queue change one step at a time.</p></div>
    <div class="how__item">${icon('code')}<h3>Write real code</h3><p>Solve problems in JavaScript or Python. Your code runs in your browser against visible examples and hidden edge cases.</p></div>
    <div class="how__item">${icon('hint')}<h3>Get unstuck the right way</h3><p>Hints come one at a time, from a nudge to nearly the answer. The full walkthrough unlocks when you solve it, or when you decide to look.</p></div>
  </div>
</section>

<section class="archive-teaser"><p>${icon('book')}Looking for the original 2017 posts on merge sort, MSTs and Markov chains? They live in <a href="/archive.html">the archive</a>.</p></section>
</div>`;
  return page({
    fullTitle: 'introtoalgo: Learn algorithms, practice problems and AI',
    title: 'introtoalgo',
    description: 'Learn algorithms and data structures with step-through lessons, solve practice problems in your browser, and learn how AI and LLMs work and how to use them well.',
    path: '/',
    track: 'home',
    main,
    scripts: ['/assets/js/home.js'],
    jsonLd: { '@context': 'https://schema.org', '@type': 'WebSite', name: 'introtoalgo', url: SITE, description: 'Learn algorithms, practice problems and AI.', author: { '@type': 'Person', name: 'Sarvesh Bhatnagar', url: 'https://www.sarveshbhatnagar.com' } },
  });
}

function aboutPage() {
  const main = `<div class="wrap wrap--narrow">
<header class="page-hero">
  <p class="eyebrow">${icon('terminal')}About</p>
  <h1 class="page-hero__title">About introtoalgo</h1>
</header>
<div class="prose">
  <p>introtoalgo started in 2017 as a small blog about algorithms. It is now a free place to learn algorithms, practise them, and understand AI well enough to use it with confidence.</p>
  <h2 id="how-it-is-built">How it is built</h2>
  <p>Every lesson starts with a concrete problem, traces the idea by hand, and only then shows code. Practice problems run in your browser: JavaScript in a sandboxed worker, Python through Pyodide. Nothing you write is sent anywhere.</p>
  <p>Your progress, saved code and theme choice live in your browser's local storage. Clearing site data resets them. There are no accounts.</p>
  <h2 id="the-author">The author</h2>
  <div class="about-author">
    <img src="/images/me.jpg" alt="Sarvesh Bhatnagar" class="about-author__photo" width="120" height="120" loading="lazy">
    <ul class="about-author__list">
      <li>I like to <a href="https://www.introtoalgo.com">write</a></li>
      <li>I like to <a href="https://github.com/sarveshbhatnagar" target="_blank" rel="noopener">code</a></li>
      <li>I like to <a href="https://scholar.google.com/citations?user=9aOqEA4AAAAJ&amp;hl=en&amp;oi=ao" target="_blank" rel="noopener">research</a></li>
      <li>I like to read <a href="https://myanimelist.net/mangalist/sarvesh1214" target="_blank" rel="noopener">manga</a></li>
      <li>I like <a href="https://www.instagram.com/sarveshbhatnagar/" target="_blank" rel="noopener">happy vibes</a></li>
      <li>I like to <a href="https://github.com/sarveshbhatnagar/LearnNewThings" target="_blank" rel="noopener">learn new things</a></li>
      <li>I am good at <a href="https://project-drive.org/team.html" target="_blank" rel="noopener">managing people</a></li>
      <li>I am a co-founder of an <a href="http://www.project-drive.org" target="_blank" rel="noopener">organization</a></li>
      <li>I also do a <a href="https://www.stitcher.com/podcast/anchor-podcasts/code-logic" target="_blank" rel="noopener">podcast</a></li>
    </ul>
  </div>
  <p>Yes, that's me, <a href="https://www.sarveshbhatnagar.com" target="_blank" rel="noopener">Sarvesh Bhatnagar</a>.</p>
</div>
</div>`;
  return page({
    title: 'About', description: 'What introtoalgo is, how the lessons and practice problems work, and who writes it.', path: '/about.html', track: 'other', main,
    jsonLd: { '@context': 'https://schema.org', '@type': 'AboutPage', name: 'About introtoalgo', url: SITE + '/about.html' },
  });
}

function archivePage() {
  const items = legacy
    .map((p) => {
      const rel = (p.related || []).map((s) => cur.lessons.get(s)).filter((l) => l && lessons.has(l.slug));
      return `<li class="arch">
  <a href="/posts/${p.slug}.html" class="arch__img">${p.image ? `<img src="${p.image}" alt="" loading="lazy">` : ''}</a>
  <div class="arch__body">
    <div class="arch__meta"><time datetime="${p.date}">${esc(p.dateLabel)}</time><span class="tag">${esc(p.tag)}</span></div>
    <h2 class="arch__title"><a href="/posts/${p.slug}.html">${esc(p.title)}</a></h2>
    <p class="arch__excerpt">${esc(p.excerpt)}</p>
    ${rel.length ? `<p class="arch__rel">${icon('book')}Newer lesson: ${rel.map((l) => `<a href="${l.url}">${esc(l.title)}</a>`).join(', ')}</p>` : ''}
  </div>
</li>`;
    })
    .join('\n');
  const main = `<div class="wrap wrap--narrow">
<header class="page-hero">
  <p class="eyebrow">${icon('book')}Archive</p>
  <h1 class="page-hero__title">The original posts</h1>
  <p class="page-hero__lead">The algorithm and CS posts this site started with, written in 2017. They stay at their original addresses. Newer, step-by-step lessons on the same topics are linked where they exist.</p>
</header>
<ul class="archive">
${items}
</ul>
</div>`;
  return page({ title: 'Archive: Original Algorithm Posts', description: 'The original 2017 introtoalgo posts on merge sort, minimum spanning trees, linked lists, graph theory and Markov chains.', path: '/archive.html', track: 'other', main });
}

function legacyPage(p) {
  const rel = (p.related || []).map((s) => cur.lessons.get(s)).filter((l) => l && lessons.has(l.slug));
  const main = `<div class="wrap wrap--narrow">
<article class="legacy">
  <header class="lesson__head">
    <nav class="crumbs" aria-label="Breadcrumb"><a href="/archive.html">Archive</a><span aria-hidden="true">/</span><span>${esc(p.tag)}</span></nav>
    <h1 class="lesson__title">${esc(p.title)}</h1>
    <p class="lesson__lead">${esc(p.lead)}</p>
    <div class="lesson__meta"><time datetime="${p.date}">${esc(p.dateLabel)}</time><span class="tag">${esc(p.tag)}</span><span>From the 2017 archive</span></div>
  </header>
  ${rel.length ? `<aside class="callout callout--tip"><div class="callout__head">${icon('tip')}<span>There is a newer lesson on this</span></div><div class="callout__body"><p>${rel.map((l) => `<a href="${l.url}">${esc(l.title)}</a>`).join(' and ')} covers this topic step by step, with code in JavaScript and Python.</p></div></aside>` : ''}
  ${p.image ? `<figure class="legacy__cover"><img src="${p.image}" alt="${esc(p.imageAlt)}">${p.caption ? `<figcaption>${esc(p.caption)}</figcaption>` : ''}</figure>` : ''}
  <div class="prose legacy__body">
${p.body}
  </div>
  <footer class="lesson__end"><a class="btn btn--ghost" href="/archive.html">${icon('prev')}All archive posts</a></footer>
</article>
</div>`;
  return page({
    title: p.title,
    fullTitle: `${p.title} | introtoalgo`,
    description: p.description,
    path: `/posts/${p.slug}.html`,
    track: 'other',
    main,
    ogType: 'article',
    jsonLd: { '@context': 'https://schema.org', '@type': 'Article', headline: p.title, datePublished: p.date, author: { '@type': 'Person', name: 'Sarvesh Bhatnagar', url: 'https://www.sarveshbhatnagar.com' }, publisher: { '@type': 'Organization', name: 'introtoalgo', url: SITE }, url: `${SITE}/posts/${p.slug}.html`, image: p.image ? SITE + p.image : undefined, description: p.description },
  });
}

function notFoundPage() {
  const main = `<div class="wrap wrap--narrow notfound">
<p class="eyebrow">${icon('terminal')}404</p>
<h1 class="page-hero__title">This page does not exist.</h1>
<p class="page-hero__lead">The link may be old, or the lesson may not be written yet. These will get you back on track:</p>
<ul class="notfound__links">
  <li><a class="btn btn--accent" href="/">Home</a></li>
  <li><a class="btn btn--ghost" href="/algorithms/">Algorithms</a></li>
  <li><a class="btn btn--ghost" href="/practice/">Practice</a></li>
  <li><a class="btn btn--ghost" href="/ai/">AI</a></li>
</ul>
</div>`;
  return page({ title: 'Page not found', description: 'This page does not exist.', path: '/404.html', track: 'other', main, noindex: true, canonical: false });
}

/* ---------------------------------------------------------------------- */
/* 7. write everything                                                     */
/* ---------------------------------------------------------------------- */
out('index.html', homePage());
for (const track of cur.tracks) {
  out(`${track.id}/index.html`, roadmapPage(track));
  for (const info of track.allLessons) if (lessons.has(info.slug)) out(`${track.id}/${info.slug}.html`, lessonPage(lessons.get(info.slug)));
}
out('practice/index.html', practiceIndex());
for (const p of problems) out(`practice/${p.slug}.html`, problemPage(p));
out('about.html', aboutPage());
out('archive.html', archivePage());
out('404.html', notFoundPage(), { inSitemap: false });
for (const p of legacy) out(`posts/${p.slug}.html`, legacyPage(p));

// Old URLs that must keep working.
const redirects = {
  'algos.html': ['/algorithms/', 'Algorithms'],
  'generic.html': ['/about.html', 'About'],
  'category.html': ['/archive.html', 'Archive'],
  'posts/coming-soon.html': ['/ai/', 'AI lessons'],
  'posts/template.html': ['/archive.html', 'Archive'],
};
for (const [from, [to, label]] of Object.entries(redirects)) out(from, redirectPage(to, label), { inSitemap: false });

const sm = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemap.map((p) => `  <url><loc>${SITE}${p}</loc></url>`).join('\n')}
</urlset>
`;
writeFileSync(join(ROOT, 'sitemap.xml'), sm);

console.log(`\nBuilt ${written.length} pages (${lessons.size} lessons, ${problems.length} problems, ${legacy.length} archive posts). Sitemap: ${sitemap.length} URLs.`);

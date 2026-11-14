// Lessons: front matter + body, validated and rendered by components.mjs.
import { readFileSync, existsSync } from 'node:fs';
import { join, basename, dirname } from 'node:path';
import { parseFrontMatter, CONTENT, problemSlugs, listFiles } from './util.mjs';
import { processLessonBody } from './components.mjs';

const FRONT_KEYS = ['title', 'description', 'minutes', 'tags', 'legacy', 'kind'];

// System design case studies ("kind": "design") follow one fixed outline.
export const DESIGN_SECTIONS = [
  'Clarify the problem',
  'Estimate the scale',
  'Define the API',
  'Model the data',
  'High-level design',
  'Deep dives',
  'Bottlenecks and failures',
  'What a strong answer sounds like',
  'Follow-up questions',
];
export const DESIGN_MODULES = ['classic-designs', 'harder-designs'];
const WORDS = { concept: [900, 1600], design: [1800, 3200] };

export function legacySlugs() {
  return listFiles(join(CONTENT, 'legacy'), '.html').map((f) => f.replace(/\.html$/, ''));
}

export function makeLinkResolver(cur) {
  const problems = new Set(problemSlugs());
  const legacy = new Set(legacySlugs());
  const trackRe = new RegExp(`^/(${cur.trackIds.join('|')})/([a-z0-9-]+)\\.html$`);
  const roots = ['/', ...cur.tracks.map((t) => t.path), '/practice/', '/about.html', '/archive.html'];
  return (href) => {
    const path = href.split('#')[0].split('?')[0];
    if (roots.includes(path)) return { ok: true };
    let m = path.match(trackRe);
    if (m) {
      const l = cur.trackLessons.get(m[1]).get(m[2]);
      if (!l) {
        const other = cur.lessons.get(m[2]);
        if (other) return { error: `Link ${href}: lesson "${m[2]}" lives at /${other.track}/${m[2]}.html.` };
        return { error: `Link ${href}: "${m[2]}" is not a lesson of the ${m[1]} track in content/curriculum.json.` };
      }
      return l.exists ? { ok: true } : { missing: true, quiet: true };
    }
    m = path.match(/^\/practice\/([a-z0-9-]+)\.html$/);
    if (m) return problems.has(m[1]) ? { ok: true } : { missing: true };
    m = path.match(/^\/posts\/([a-z0-9-]+)\.html$/);
    if (m) return legacy.has(m[1]) ? { ok: true } : { error: `Link ${href}: there is no legacy post "${m[1]}".` };
    if (/^\/(images|assets|posts\/img)\//.test(path)) return existsSync(join(CONTENT, '..', path)) ? { ok: true } : { error: `Link ${href}: file not found.` };
    return { error: `Link ${href} does not point at a known page. Link to ${cur.trackIds.map((t) => `/${t}/<slug>.html`).join(', ')}, /practice/<slug>.html or /posts/<name>.html.` };
  };
}

export function checkLessonFile(file, cur, resolveLink) {
  const errors = [], warnings = [];
  const E = (msg, line = null) => errors.push({ line, msg });
  const W = (msg, line = null) => warnings.push({ line, msg });
  const track = basename(dirname(file));
  const slug = basename(file, '.html');
  const known = cur.trackIds.includes(track);
  const info = known ? cur.trackLessons.get(track).get(slug) : null;
  if (!known) E(`Lessons live in ${cur.trackIds.map((t) => `content/${t}/`).join(', ')}.`);
  else if (!info) {
    const other = cur.lessons.get(slug);
    if (other) E(`"${slug}" belongs to the ${other.track} track; move the file to content/${other.track}/.`);
    else E(`"${slug}" is not a lesson slug of the ${track} track in content/curriculum.json. Name the file exactly after its slug.`);
  }

  const src = readFileSync(file, 'utf8');
  const fm = parseFrontMatter(src);
  if (fm.error) { E(fm.error, 1); return { errors, warnings }; }
  const d = fm.data;
  for (const k of Object.keys(d)) if (!FRONT_KEYS.includes(k)) E(`Front matter: unknown key "${k}". Allowed: ${FRONT_KEYS.join(', ')}.`, 1);
  if (typeof d.title !== 'string' || d.title.length < 3 || d.title.length > 70) E('Front matter: "title" must be a string of 3 to 70 characters.', 1);
  if (typeof d.description !== 'string') E('Front matter: "description" is required (a plain sentence, max 155 characters, used by search engines).', 1);
  else {
    if (d.description.length > 155) E(`Front matter: "description" is ${d.description.length} characters; the limit is 155.`, 1);
    if (d.description.length < 50) W(`Front matter: "description" is only ${d.description.length} characters; aim for 80 to 155.`, 1);
    if (/[<>]/.test(d.description)) E('Front matter: "description" must be plain text (no HTML).', 1);
  }
  if (!Number.isInteger(d.minutes) || d.minutes < 3 || d.minutes > 40) E('Front matter: "minutes" must be a whole number from 3 to 40.', 1);
  if (d.tags !== undefined && (!Array.isArray(d.tags) || !d.tags.every((t) => typeof t === 'string'))) E('Front matter: "tags" must be a list of strings.', 1);
  const legacy = new Set(legacySlugs());
  if (d.legacy !== undefined) {
    if (!Array.isArray(d.legacy) || !d.legacy.every((s) => typeof s === 'string')) E('Front matter: "legacy" must be a list of legacy post names, like ["mergesort"].', 1);
    else for (const s of d.legacy) if (!legacy.has(s)) E(`Front matter: legacy post "${s}" does not exist. Options: ${[...legacy].join(', ')}.`, 1);
  }
  const sd = track === 'system-design';
  if (d.kind !== undefined) {
    if (d.kind !== 'design' && d.kind !== 'concept') E('Front matter: "kind" must be "design" (a case study) or "concept" (the default).', 1);
    else if (d.kind === 'design' && !sd) E('Front matter: "kind": "design" is only for system design case studies (content/system-design/).', 1);
  }
  const kind = d.kind === 'design' ? 'design' : 'concept';
  if (sd && info && DESIGN_MODULES.includes(info.module.id) && kind !== 'design') E(`Front matter: lessons in the "${info.module.title}" module are case studies. Add "kind": "design".`, 1);
  if (sd && info && !DESIGN_MODULES.includes(info.module.id) && kind === 'design') E(`Front matter: "kind": "design" is for the case studies in the Classic Designs and Harder Designs modules; "${slug}" is a concept lesson.`, 1);

  const body = processLessonBody(fm.body, { lineOffset: fm.bodyLine, resolveLink, track });
  errors.push(...body.errors);
  warnings.push(...body.warnings);
  const [minW, maxW] = WORDS[kind];
  if (body.words < minW || body.words > maxW) W(`Length: about ${body.words} words of prose. The target for ${kind === 'design' ? 'a design case study' : 'a lesson'} is ${minW} to ${maxW}.`);
  if (track === 'algorithms' && !body.used['x-tracer'] && !body.used['x-figure']) W('Quality bar: use at least one <x-tracer> or <x-figure>.');
  if (track === 'ai' && !body.used['x-tracer'] && !body.used['x-figure'] && !body.used['x-prompt']) W('Quality bar: use at least one <x-tracer>, <x-figure> or <x-prompt>.');
  if (track === 'ai' && !body.used['x-tryit']) W('AI lessons should include an <x-tryit> exercise.');
  if (kind !== 'design' && !body.used['x-quiz']) W('Quality bar: end with an <x-quiz> quick check.');
  if (track === 'algorithms' && !body.used['x-code']) W('Algorithms lessons should show code with <x-code>.');
  if (track === 'algorithms' && !body.used['x-complexity']) W('Algorithms lessons should summarise cost with <x-complexity>.');
  if (sd && kind === 'design') checkDesignOutline(body.outline, E);
  if (sd && kind === 'concept') checkConceptLesson(body, W);
  return { errors, warnings, front: d, body, slug, track, info, kind };
}

function checkConceptLesson(body, W) {
  const u = body.used;
  if (!u['x-arch'] && !u['x-tracer'] && !u['x-figure']) W('Quality bar: show how it works with an <x-arch> diagram, an <x-tracer> or an <x-figure>.');
  if (!u['x-tradeoffs']) W('Quality bar: compare the options with an <x-tradeoffs> table.');
  if (!u['x-callout'] || !/callout--mistake/.test(body.html)) W('Quality bar: add at least one <x-callout type="mistake">.');
  if (!body.outline.h2s.some((h) => /^in the interview\b/i.test(h.text))) W('Quality bar: add an <h2>In the interview</h2> section (when to bring it up, phrases that show judgement, follow-up questions).');
}

// A design case study must use the fixed section headings, in order, and the
// components each section is built around.
function checkDesignOutline(outline, E) {
  const { h2s, comps } = outline;
  const titles = h2s.map((h) => h.text.trim());
  const allowedTail = ['What to practise next', 'What to practice next'];
  let pos = -1;
  const idx = DESIGN_SECTIONS.map((t) => titles.indexOf(t));
  DESIGN_SECTIONS.forEach((t, i) => {
    if (idx[i] < 0) E(`Design lesson: missing the section <h2>${t}</h2>. Case studies use these headings, exactly and in this order: ${DESIGN_SECTIONS.join(' → ')}.`);
    else if (idx[i] < pos) E(`Design lesson: <h2>${t}</h2> is out of order. The order is: ${DESIGN_SECTIONS.join(' → ')}.`, h2s[idx[i]].line);
    else pos = idx[i];
  });
  h2s.forEach((h) => {
    if (!DESIGN_SECTIONS.includes(h.text.trim()) && !allowedTail.includes(h.text.trim())) E(`Design lesson: <h2>${h.text}</h2> is not one of the fixed sections. Use <h3> for sub-headings inside a section. Allowed <h2>s: ${DESIGN_SECTIONS.join(', ')}, and an optional last "What to practise next".`, h.line);
  });
  const tail = allowedTail.map((t) => titles.indexOf(t)).find((i) => i >= 0);
  if (tail !== undefined && tail !== titles.length - 1) E('Design lesson: "What to practise next" must be the last section.', h2s[tail].line);
  if (idx.some((i) => i < 0)) return; // the checks below need every section
  // section number of each fixed heading (sections are counted from 1 = after the first h2)
  const sec = Object.fromEntries(DESIGN_SECTIONS.map((t, i) => [t, idx[i] + 1]));
  const inSec = (t, pred) => comps.filter((c) => c.section === sec[t] && pred(c));
  const need = (t, pred, what) => { if (!inSec(t, pred).length) E(`Design lesson: the "${t}" section needs ${what}.`, h2s[sec[t] - 1].line); };
  need('Clarify the problem', (c) => c.name === 'x-interview', 'an <x-interview> showing the clarifying questions and answers');
  need('Estimate the scale', (c) => c.name === 'x-estimate', 'at least one <x-estimate> exercise');
  need('High-level design', (c) => c.name === 'x-arch', 'an <x-arch> diagram of the whole system');
  if (inSec('High-level design', (c) => c.name === 'x-tracer' && c.arch).length < 1) E('Design lesson: the "High-level design" section needs an <x-tracer> with an "arch" diagram that walks the main read path and write path (one tracer for both, or one each).', h2s[sec['High-level design'] - 1].line);
  need('Deep dives', (c) => c.name === 'x-tradeoffs', 'an <x-tradeoffs> table for at least one hard choice');
  // "Your turn" boxes right before sections 3, 4 and 5: the last component of sections 2, 3 and 4
  for (const t of ['Define the API', 'Model the data', 'High-level design']) {
    const before = comps.filter((c) => c.section === sec[t] - 1 && c.name !== 'x-code' && c.name !== 'x-arch');
    const turn = before.filter((c) => c.name === 'x-tryit' && c.attrs.variant === 'turn');
    if (!turn.length) E(`Design lesson: put an <x-tryit variant="turn"> box at the end of the section before <h2>${t}</h2>, so the learner tries that step before reading it.`, h2s[sec[t] - 1].line);
  }
  if (!comps.some((c) => c.name === 'x-checklist' && c.section >= sec['Follow-up questions'])) E('Design lesson: end with an <x-checklist> self-review after the "Follow-up questions" section.');
}

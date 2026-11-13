// Lessons: front matter + body, validated and rendered by components.mjs.
import { readFileSync, existsSync } from 'node:fs';
import { join, basename, dirname } from 'node:path';
import { parseFrontMatter, CONTENT, problemSlugs, listFiles } from './util.mjs';
import { processLessonBody } from './components.mjs';

const FRONT_KEYS = ['title', 'description', 'minutes', 'tags', 'legacy'];

export function legacySlugs() {
  return listFiles(join(CONTENT, 'legacy'), '.html').map((f) => f.replace(/\.html$/, ''));
}

export function makeLinkResolver(cur) {
  const problems = new Set(problemSlugs());
  const legacy = new Set(legacySlugs());
  return (href) => {
    const path = href.split('#')[0].split('?')[0];
    if (['/', '/algorithms/', '/ai/', '/practice/', '/about.html', '/archive.html'].includes(path)) return { ok: true };
    let m = path.match(/^\/(algorithms|ai)\/([a-z0-9-]+)\.html$/);
    if (m) {
      const l = cur.lessons.get(m[2]);
      if (!l) return { error: `Link ${href}: "${m[2]}" is not a lesson in content/curriculum.json.` };
      if (l.track !== m[1]) return { error: `Link ${href}: lesson "${m[2]}" lives at /${l.track}/${m[2]}.html.` };
      return l.exists ? { ok: true } : { missing: true, quiet: true };
    }
    m = path.match(/^\/practice\/([a-z0-9-]+)\.html$/);
    if (m) return problems.has(m[1]) ? { ok: true } : { missing: true };
    m = path.match(/^\/posts\/([a-z0-9-]+)\.html$/);
    if (m) return legacy.has(m[1]) ? { ok: true } : { error: `Link ${href}: there is no legacy post "${m[1]}".` };
    if (/^\/(images|assets|posts\/img)\//.test(path)) return existsSync(join(CONTENT, '..', path)) ? { ok: true } : { error: `Link ${href}: file not found.` };
    return { error: `Link ${href} does not point at a known page. Link to /algorithms/<slug>.html, /ai/<slug>.html, /practice/<slug>.html or /posts/<name>.html.` };
  };
}

export function checkLessonFile(file, cur, resolveLink) {
  const errors = [], warnings = [];
  const E = (msg, line = null) => errors.push({ line, msg });
  const W = (msg, line = null) => warnings.push({ line, msg });
  const track = basename(dirname(file));
  const slug = basename(file, '.html');
  const info = cur.lessons.get(slug);
  if (!['algorithms', 'ai'].includes(track)) E('Lessons live in content/algorithms/ or content/ai/.');
  if (!info) E(`"${slug}" is not a lesson slug in content/curriculum.json. Name the file exactly after its slug.`);
  else if (info.track !== track) E(`"${slug}" belongs to the ${info.track} track; move the file to content/${info.track}/.`);

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

  const body = processLessonBody(fm.body, { lineOffset: fm.bodyLine, resolveLink, track });
  errors.push(...body.errors);
  warnings.push(...body.warnings);
  if (body.words < 900 || body.words > 1600) W(`Length: about ${body.words} words of prose. The target is 900 to 1600.`);
  if (track === 'algorithms' && !body.used['x-tracer'] && !body.used['x-figure']) W('Quality bar: use at least one <x-tracer> or <x-figure>.');
  if (track === 'ai' && !body.used['x-tracer'] && !body.used['x-figure'] && !body.used['x-prompt']) W('Quality bar: use at least one <x-tracer>, <x-figure> or <x-prompt>.');
  if (track === 'ai' && !body.used['x-tryit']) W('AI lessons should include an <x-tryit> exercise.');
  if (!body.used['x-quiz']) W('Quality bar: end with an <x-quiz> quick check.');
  if (track === 'algorithms' && !body.used['x-code']) W('Algorithms lessons should show code with <x-code>.');
  if (track === 'algorithms' && !body.used['x-complexity']) W('Algorithms lessons should summarise cost with <x-complexity>.');
  return { errors, warnings, front: d, body, slug, track, info };
}

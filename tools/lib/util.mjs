// Shared helpers for tools/build.mjs and tools/check.mjs. No dependencies.
import { readFileSync, existsSync, readdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

export const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..', '..');
export const CONTENT = join(ROOT, 'content');
export const SITE = 'https://introtoalgo.com';

export function esc(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

// Strip tags for plain-text use (meta, word counts, aria labels).
export function stripTags(html) {
  return String(html ?? '').replace(/<script[\s\S]*?<\/script>/gi, ' ').replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/\s+/g, ' ').trim();
}

export function slugify(text) {
  return stripTags(text).toLowerCase().replace(/['’]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'section';
}

// Fields in problem JSON may be a string or an array of lines.
export function joinLines(v) {
  if (Array.isArray(v)) return v.join('\n');
  return v == null ? '' : String(v);
}

export function readJSON(path) {
  return JSON.parse(readFileSync(path, 'utf8'));
}

export function listFiles(dir, ext) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).filter((f) => f.endsWith(ext) && !f.startsWith('_') && !f.startsWith('.')).sort();
}

// Remove common leading indentation and leading/trailing blank lines.
export function dedent(text) {
  let lines = String(text).replace(/\r\n?/g, '\n').replace(/\t/g, '    ').split('\n');
  while (lines.length && !lines[0].trim()) lines.shift();
  while (lines.length && !lines[lines.length - 1].trim()) lines.pop();
  const indents = lines.filter((l) => l.trim()).map((l) => l.match(/^ */)[0].length);
  const min = indents.length ? Math.min(...indents) : 0;
  return lines.map((l) => l.slice(min)).join('\n');
}

/* ---------- front matter ---------- */

// A lesson file starts with an HTML comment holding JSON:
// <!--
// { "title": "...", ... }
// -->
export function parseFrontMatter(src) {
  const m = src.match(/^﻿?\s*<!--([\s\S]*?)-->/);
  if (!m) return { error: 'The file must start with a front-matter block: <!-- { "title": ... } -->' };
  let data;
  try {
    data = JSON.parse(m[1]);
  } catch (e) {
    return { error: 'Front matter is not valid JSON: ' + e.message };
  }
  return { data, body: src.slice(m[0].length), bodyLine: m[0].split('\n').length };
}

/* ---------- attributes ---------- */

export function parseAttrs(str) {
  const attrs = {};
  const re = /([a-zA-Z_:][-a-zA-Z0-9_:.]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'=<>`]+)))?/g;
  let m;
  while ((m = re.exec(str || ''))) attrs[m[1].toLowerCase()] = m[2] ?? m[3] ?? m[4] ?? '';
  return attrs;
}

/* ---------- curriculum ---------- */

// Lesson slugs are looked up per track (cur.trackLessons.get(trackId).get(slug)).
// They are also unique across tracks, so `related`, practice topics and
// "start here" can name a lesson by slug alone (cur.lessons.get(slug)).
export function loadCurriculum() {
  const cur = readJSON(join(CONTENT, 'curriculum.json'));
  const lessons = new Map(); // slug -> info
  const trackLessons = new Map(); // track id -> Map(slug -> info)
  for (const track of cur.tracks) {
    let index = 0;
    track.allLessons = [];
    trackLessons.set(track.id, new Map());
    track.modules.forEach((mod, mi) => {
      mod.number = mi + 1;
      mod.track = track;
      mod.lessons.forEach((l, li) => {
        const info = { ...l, track: track.id, trackObj: track, module: mod, moduleIndex: mi, indexInModule: li, index: index++ };
        info.url = `${track.path}${l.slug}.html`;
        info.file = join(CONTENT, track.id, `${l.slug}.html`);
        info.exists = existsSync(info.file);
        if (lessons.has(l.slug)) throw new Error(`curriculum.json: lesson slug "${l.slug}" is used twice (in ${lessons.get(l.slug).track} and ${track.id})`);
        lessons.set(l.slug, info);
        trackLessons.get(track.id).set(l.slug, info);
        track.allLessons.push(info);
      });
    });
  }
  const topics = new Map(cur.practiceTopics.map((t, i) => [t.id, { ...t, index: i }]));
  for (const t of cur.practiceTopics) for (const s of t.lessons) if (!lessons.has(s)) throw new Error(`curriculum.json: practice topic "${t.id}" names unknown lesson "${s}"`);
  return { ...cur, lessons, trackLessons, trackIds: cur.tracks.map((t) => t.id), topics };
}

export const PROBLEM_DIR = join(CONTENT, 'practice');

export function problemSlugs() {
  return listFiles(PROBLEM_DIR, '.json').map((f) => f.replace(/\.json$/, ''));
}

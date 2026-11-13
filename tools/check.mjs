#!/usr/bin/env node
// Validate content files. Never writes into the repo, so many writers can run
// it at the same time.
//
//   node tools/check.mjs                         check everything in content/
//   node tools/check.mjs content/practice/x.json content/algorithms/y.html
//   node tools/check.mjs --no-run ...            skip running solutions (schema only)
//   node tools/check.mjs --quiet ...             only print files with problems
//
// Exit code 1 if any error was found. Warnings never fail the check.
import { resolve, relative, join } from 'node:path';
import { existsSync, statSync } from 'node:fs';
import { ROOT, CONTENT, loadCurriculum, listFiles, readJSON } from './lib/util.mjs';
import { checkProblemFile } from './lib/problems.mjs';
import { checkLessonFile, makeLinkResolver } from './lib/lessons.mjs';

const argv = process.argv.slice(2);
const flags = new Set(argv.filter((a) => a.startsWith('--')));
let files = argv.filter((a) => !a.startsWith('--')).map((f) => resolve(f));
const run = !flags.has('--no-run');
const quiet = flags.has('--quiet');

const C = process.stdout.isTTY ? { r: '\x1b[31m', y: '\x1b[33m', g: '\x1b[32m', d: '\x1b[2m', x: '\x1b[0m' } : { r: '', y: '', g: '', d: '', x: '' };

export function checkAll(fileList, { run = true, quiet = false, log = console.log } = {}) {
  let cur;
  try {
    cur = loadCurriculum();
  } catch (e) {
    log(`${C.r}content/curriculum.json: ${e.message}${C.x}`);
    return { errors: 1, warnings: 0 };
  }
  const resolveLink = makeLinkResolver(cur);
  // a directory argument means "every content file inside it"
  fileList = fileList.flatMap((f) => (existsSync(f) && statSync(f).isDirectory() ? [...listFiles(f, '.html'), ...listFiles(f, '.json')].filter((x) => x !== 'curriculum.json').map((x) => join(f, x)) : [f]));
  if (!fileList.length) {
    fileList = [
      ...listFiles(join(CONTENT, 'algorithms'), '.html').map((f) => join(CONTENT, 'algorithms', f)),
      ...listFiles(join(CONTENT, 'ai'), '.html').map((f) => join(CONTENT, 'ai', f)),
      ...listFiles(join(CONTENT, 'practice'), '.json').map((f) => join(CONTENT, 'practice', f)),
    ];
  }
  let nErr = 0, nWarn = 0;
  const orders = new Map();
  const results = [];
  for (const file of fileList) {
    const rel = relative(ROOT, file);
    let res;
    if (!existsSync(file) || !statSync(file).isFile()) res = { errors: [{ line: null, msg: 'File not found.' }], warnings: [] };
    else if (file.endsWith('.json') && file.includes(`${'content'}/practice/`)) res = checkProblemFile(file, cur, { run });
    else if (file.endsWith('.html') && /content\/(algorithms|ai)\//.test(file)) res = checkLessonFile(file, cur, resolveLink);
    else res = { errors: [{ line: null, msg: 'Not a lesson (content/algorithms|ai/*.html) or problem (content/practice/*.json).' }], warnings: [] };
    if (res.problem) {
      const key = `${res.problem.topic}#${res.problem.order}`;
      if (orders.has(key)) res.warnings.push({ line: null, msg: `"order" ${res.problem.order} in topic ${res.problem.topic} is also used by ${orders.get(key)}.` });
      orders.set(key, res.problem.slug);
    }
    nErr += res.errors.length;
    nWarn += res.warnings.length;
    results.push({ rel, res });
    if (quiet && !res.errors.length && !res.warnings.length) continue;
    const status = res.errors.length ? `${C.r}FAIL${C.x}` : res.warnings.length ? `${C.y}WARN${C.x}` : `${C.g}OK${C.x}  `;
    log(`${status} ${rel}`);
    for (const e of res.errors) log(`  ${C.r}error${C.x}${e.line ? ` ${C.d}line ${e.line}${C.x}` : ''}: ${e.msg}`);
    for (const w of res.warnings) log(`  ${C.y}warn${C.x}${w.line ? ` ${C.d}line ${w.line}${C.x}` : ''}: ${w.msg}`);
  }
  log(`\n${fileList.length} file(s): ${nErr ? C.r : C.g}${nErr} error(s)${C.x}, ${nWarn ? C.y : ''}${nWarn} warning(s)${C.x}`);
  return { errors: nErr, warnings: nWarn, results };
}

if (import.meta.url === `file://${process.argv[1]}` || process.argv[1]?.endsWith('check.mjs')) {
  const { errors } = checkAll(files, { run, quiet });
  process.exit(errors ? 1 : 0);
}

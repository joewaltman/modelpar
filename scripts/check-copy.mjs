// Copy lint. Enforces the house rules and lists placeholders still waiting for real values.
//   1. No em or en dashes anywhere: copy, code comments, metadata, docs.
//   2. No emoji anywhere.
//   3. In what visitors read (the built HTML): no hype words and no exclamation marks.
// Run: npm run check:copy (builds first if dist/ is missing). Exit 1 on any violation.
import { readFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join, relative, extname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execSync } from 'node:child_process';

const root = fileURLToPath(new URL('..', import.meta.url));
const SKIP_DIRS = new Set(['node_modules', 'dist', '.astro', '.git', 'screenshots', 'lighthouse', '.vercel']);
const SKIP_FILES = new Set(['copy-draft.md', 'package-lock.json']);
const TEXT_EXT = new Set(['.ts', '.mjs', '.js', '.astro', '.css', '.md', '.json', '.yml', '.yaml', '.svg', '.txt', '.html', '.xml']);

const DASHES = new RegExp('[\\u2013\\u2014\\u2015\\u2e3a\\u2e3b]', 'g');
// Copyright, registered and trademark signs are pictographic in Unicode but are not emoji.
const EMOJI = new RegExp('(?![\\u00a9\\u00ae\\u2122])\\p{Extended_Pictographic}', 'gu');
const HYPE = [
  'revolutioniz',
  'supercharg',
  'unlock',
  'seamless',
  'ai-powered',
  'ai powered',
  'game-chang',
  'game chang',
  'cutting-edge',
  'next-gen',
  'world-class',
  'effortless',
  'skyrocket',
  'turbocharg',
];

const problems = [];
const report = (file, line, rule, text) => problems.push({ file, line, rule, text: text.trim().slice(0, 140) });

function walk(dir, out = []) {
  for (const name of readdirSync(dir)) {
    if (SKIP_DIRS.has(name) || SKIP_FILES.has(name)) continue;
    const p = join(dir, name);
    const st = statSync(p);
    if (st.isDirectory()) walk(p, out);
    else if (TEXT_EXT.has(extname(name)) || name === 'security.txt') out.push(p);
  }
  return out;
}

// 1 and 2: every source file.
for (const file of walk(root)) {
  const rel = relative(root, file);
  readFileSync(file, 'utf8')
    .split('\n')
    .forEach((line, i) => {
      if (DASHES.test(line)) report(rel, i + 1, 'dash', line);
      DASHES.lastIndex = 0;
      if (EMOJI.test(line)) report(rel, i + 1, 'emoji', line);
      EMOJI.lastIndex = 0;
    });
}

// 3: visible text of the built site.
const dist = join(root, 'dist');
if (!existsSync(dist)) {
  console.log('dist/ not found, building first...');
  execSync('npm run build', { cwd: root, stdio: 'ignore' });
}
const visibleText = (html) =>
  html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<!doctype[^>]*>/gi, ' ')
    // Keep attribute text people can read or hear: alt, title, aria-label, placeholder, content.
    .replace(/<[^>]*?\s(?:alt|title|aria-label|placeholder|content)="([^"]*)"[^>]*>/gi, ' $1 ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&#39;|&apos;/g, "'")
    .replace(/&quot;/g, '"')
    .replace(/\s+/g, ' ');

const pages = walk(dist).filter((f) => f.endsWith('.html'));
const placeholders = new Map();
for (const file of pages) {
  const rel = relative(root, file);
  const text = visibleText(readFileSync(file, 'utf8'));
  const lower = text.toLowerCase();
  for (const word of HYPE) {
    let at = lower.indexOf(word);
    while (at !== -1) {
      report(rel, 0, `hype word "${word}"`, text.slice(Math.max(0, at - 50), at + 60));
      at = lower.indexOf(word, at + 1);
    }
  }
  for (const m of text.matchAll(/!/g)) report(rel, 0, 'exclamation mark', text.slice(Math.max(0, m.index - 60), m.index + 20));
  for (const m of text.matchAll(/\[[^\]\n]{2,90}\]/g)) {
    const key = m[0];
    if (!placeholders.has(key)) placeholders.set(key, new Set());
    placeholders.get(key).add(rel.replace(/^dist\//, '/').replace(/\.html$/, '').replace(/\/index$/, '/'));
  }
}

if (placeholders.size) {
  console.log('Placeholders still on the site (fill these before launch):');
  for (const [p, where] of placeholders) console.log(`  ${p}  on ${[...where].join(', ')}`);
  console.log('');
}

if (problems.length) {
  console.log(`${problems.length} copy rule violation(s):`);
  for (const p of problems) console.log(`  ${p.file}${p.line ? ':' + p.line : ''}  ${p.rule}: ${p.text}`);
  process.exit(1);
}
console.log(`Copy rules pass: no dashes or emoji in ${walk(root).length} source files; no hype words or exclamation marks on ${pages.length} pages.`);

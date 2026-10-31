#!/usr/bin/env node
// Verifies every list price behind /sample against the provider's own pricing
// page. Expected numbers come from src/content/sample-data.ts, so the only edit
// after a real price change is in that file.
//
// Usage:
//   node scripts/check-prices.mjs [--write-date] [--markdown <file>]
//
// Exit codes: 0 all checks pass, 1 any FAIL, 2 fetch ERRORs but no FAIL.
//
// When a check FAILs, read the context in the report:
//   - The page shows a different number: update sample-data.ts.
//   - The row or section was not found: the page layout changed. Fix that
//     check's rule in CHECKS below.

import { readFile, writeFile } from 'node:fs/promises';
import { prices, seats, tiers, sampleMeta } from '../src/content/sample-data.ts';

// ---------------------------------------------------------------------------
// Sources. Docs sites that can serve markdown are fetched as markdown: it is
// far easier to parse than their HTML and changes layout less often.
// ---------------------------------------------------------------------------

const SOURCES = {
  // No markdown version, so the HTML is split into text segments.
  claude: { url: 'https://claude.com/pricing', format: 'html' },
  // Returns markdown for both the plain URL and the .md URL.
  openai: { url: 'https://developers.openai.com/api/docs/pricing.md', format: 'markdown' },
  // Google devsite serves markdown at <page>.md.txt (plain .md returns HTML).
  gemini: { url: 'https://ai.google.dev/gemini-api/docs/pricing.md.txt', format: 'markdown' },
  together: { url: 'https://docs.together.ai/docs/serverless/models.md', format: 'markdown' },
  // The .md URL 404s here, but the page URL returns markdown when asked for it.
  cursor: { url: 'https://cursor.com/docs/account/teams/pricing', format: 'markdown' },
  // Price cells on this page are placeholders, filled in by the browser from
  // AWS's public price JSON. We resolve them the same way (see checkBedrock).
  bedrock: {
    url: 'https://aws.amazon.com/bedrock/pricing/',
    format: 'html',
    priceJsonBase: 'https://b0.p.awsstatic.com/pricing/2.0/meteredUnitMaps',
  },
};

// ---------------------------------------------------------------------------
// Checks. One entry per model, seat or discount. Kinds of locator:
//
//   card    (HTML pages) Start at the segment equal to `title`, stop at `end`.
//           pick 'after': the first $ amount after each label.
//           pick 'before': the nearest $ amount before each label.
//   table   (markdown) Narrow to a section with `path`, then find a table row.
//           With `row`: the row whose `keyCol` (default: first column) equals
//           `row`; labels are column headers.
//           With `col`: labels are row names (first column), values from `col`.
//           With `starting`: take the $ amount followed by "starting <date>".
//   pattern Regex per label, run on a markdown section (or the whole page);
//           capture group 1 is the number.
//   bedrock See checkBedrock.
//
// Path steps: `after` (start looking after this text), `heading` (exact
// heading text, the section runs to the next heading of the same or higher
// level), `contains` (the section must contain this text).
//
// `price: key` checks prices[key]; `fields` maps page labels to its fields.
// Other checks list their expected numbers in `expect`.
// ---------------------------------------------------------------------------

const CLAUDE_CARD_END = /^(Fable|Mythos|Opus|Sonnet|Haiku) \d+(\.\d+)?$|^Explore detailed pricing$|^Legacy models$/;
const CLAUDE_FIELDS = { Input: 'in', Output: 'out', Read: 'cacheRead', Write: 'cacheWrite' };
const OPENAI_FIELDS = {
  'Short context input': 'in',
  'Short context output': 'out',
  'Short context cached input': 'cacheRead',
  // sample-data's cacheWrite is the shortest cache-write rate.
  'Short context 30m write': 'cacheWrite',
};
const OPENAI_STANDARD = [{ after: 'Flagship models', heading: 'Standard pricing data' }];
const GEMINI_PAID = 'Paid Tier, per 1M tokens in USD';
const GEMINI_FIELDS = {
  'Input price': 'in',
  'Output price (including thinking tokens)': 'out',
  'Context caching price': 'cacheRead',
};
const TOGETHER_FIELDS = {
  'Input pricing (per 1M tokens)': 'in',
  'Cached input pricing (per 1M tokens)': 'cacheRead',
  'Output pricing (per 1M tokens)': 'out',
};
const geminiStandard = (heading, id) => [{ heading, contains: '`' + id + '`' }, { heading: 'Standard' }];

const CHECKS = [
  // Anthropic API. Cards read "Read $0.10 / MTok Write $2.50 / MTok Input $2 ...".
  { price: 'sonnet', source: 'claude', card: { title: 'Sonnet 5.5', end: CLAUDE_CARD_END, pick: 'after' }, fields: CLAUDE_FIELDS },
  { price: 'opus', source: 'claude', card: { title: 'Opus 5.5', end: CLAUDE_CARD_END, pick: 'after' }, fields: CLAUDE_FIELDS },
  // Haiku shows two tiers per label, "Prompts ≤ 100K tokens" first. The first
  // value after each label is that tier.
  {
    price: 'haiku',
    source: 'claude',
    card: { title: 'Haiku 5.5', end: CLAUDE_CARD_END, pick: 'after', mustContain: 'Prompts ≤ 100K tokens' },
    fields: CLAUDE_FIELDS,
  },

  // OpenAI. The Standard table under "Flagship models" is the default tier;
  // later Standard tables (cyber, life sciences) are other model families.
  { price: 'sol', source: 'openai', table: { path: OPENAI_STANDARD, row: 'gpt-6.1-sol' }, fields: OPENAI_FIELDS },
  { price: 'terra', source: 'openai', table: { path: OPENAI_STANDARD, row: 'gpt-6.1-terra' }, fields: OPENAI_FIELDS },
  {
    price: 'embed',
    source: 'openai',
    table: { path: [{ after: 'Specialized models', heading: 'Grouped Pricing Table data' }], keyCol: 'Model', row: 'text-embedding-3-small' },
    fields: { Input: 'in', Output: 'out' },
  },

  // Google. One "## Gemini ..." section per model, each with a Standard table.
  { price: 'flash', source: 'gemini', table: { path: geminiStandard('Gemini 3.8 Flash', 'gemini-3.8-flash'), col: GEMINI_PAID }, fields: GEMINI_FIELDS },
  {
    scheduled: 'flash',
    source: 'gemini',
    table: { path: geminiStandard('Gemini 3.8 Flash', 'gemini-3.8-flash'), col: GEMINI_PAID, starting: prices.flash.next.from },
    expect: {
      'Input price': prices.flash.next.in,
      'Output price (including thinking tokens)': prices.flash.next.out,
    },
  },
  { price: 'flashLite31', source: 'gemini', table: { path: geminiStandard('Gemini 3.1 Flash-Lite', 'gemini-3.1-flash-lite'), col: GEMINI_PAID }, fields: GEMINI_FIELDS },
  { price: 'flashLite35', source: 'gemini', table: { path: geminiStandard('Gemini 3.5 Flash-Lite', 'gemini-3.5-flash-lite'), col: GEMINI_PAID }, fields: GEMINI_FIELDS },

  // Together AI. Matched on the exact API model string, so dated variants
  // like DeepSeek-V4.1-Flash-1017 are not confused with the main row.
  {
    price: 'deepseek',
    source: 'together',
    table: { path: [{ heading: 'Chat models' }], keyCol: 'API model string', row: 'deepseek-ai/DeepSeek-V4.1-Flash' },
    fields: TOGETHER_FIELDS,
  },
  // No cacheRead in sample-data, so the cached column must show no price.
  {
    price: 'gptoss',
    source: 'together',
    table: { path: [{ heading: 'Chat models' }], keyCol: 'API model string', row: 'openai/gpt-oss-120b' },
    fields: TOGETHER_FIELDS,
  },

  // Seats, per user per month.
  {
    name: 'Claude Team Standard seat',
    source: 'claude',
    card: { title: 'Standard seat', end: /^Premium seat$/, pick: 'before' },
    expect: {
      'if billed monthly.': seats.claudeTeamStandard,
      'Per seat / month if billed annually.': seats.claudeTeamStandardAnnual,
    },
  },
  {
    name: 'Claude Team Premium seat',
    source: 'claude',
    card: { title: 'Premium seat', end: /^Enterprise$/, pick: 'before' },
    expect: {
      'if billed monthly.': seats.claudeTeamPremium,
      'Per seat / month if billed annually.': seats.claudeTeamPremiumAnnual,
    },
  },
  {
    name: 'Cursor Teams Premium seat',
    source: 'cursor',
    pattern: { path: [{ heading: 'Seat tiers' }] },
    patterns: { 'Premium ($/user/mo)': /\*\*Premium\*\*: \$([\d.]+)\/user\/mo/ },
    expect: { 'Premium ($/user/mo)': seats.cursorTeamsPremium },
  },
  {
    name: 'Cursor Token Rate',
    source: 'cursor',
    pattern: { path: [{ heading: 'Cursor Token Rate' }] },
    patterns: { 'Token Rate ($/1M tokens)': /Cursor Token Rate is \$([\d.]+) per million tokens/ },
    expect: { 'Token Rate ($/1M tokens)': seats.cursorTokenRate },
  },

  // Discounts and uplifts from `tiers`.
  // Batch rows checked as a multiple of the Standard row, which is what /sample computes.
  {
    name: 'OpenAI Batch discount (gpt-6.1-sol)',
    source: 'openai',
    table: { path: [{ after: 'Flagship models', heading: 'Batch pricing data' }, { heading: 'Batch' }], row: 'gpt-6.1-sol' },
    expect: {
      'Short context input': prices.sol.in * tiers.batchFactor,
      'Short context output': prices.sol.out * tiers.batchFactor,
    },
  },
  {
    name: 'Anthropic Batch discount',
    source: 'claude',
    pattern: {},
    patterns: { 'Batch discount': /Save (\d+)% with batch processing/ },
    expect: { 'Batch discount': (1 - tiers.batchFactor) * 100 },
    unit: '%',
  },
  // The EU support workload runs Sonnet on Bedrock Geo/In-region endpoints.
  {
    name: 'AWS Bedrock Geo/In-region uplift (claude-sonnet-5-5)',
    source: 'bedrock',
    bedrock: {
      model: 'Claude Sonnet 5.5',
      region: 'EU (Frankfurt)',
      tables: { Global: 'Global Cross-region Inference', Geo: 'Geo and In-region Cross-region Inference' },
    },
    expect: {
      'Global input': prices.sonnet.in,
      'Global output': prices.sonnet.out,
      'Geo input': prices.sonnet.in * tiers.bedrockInRegionFactor,
      'Geo output': prices.sonnet.out * tiers.bedrockInRegionFactor,
    },
  },
];

// ---------------------------------------------------------------------------
// Fetching
// ---------------------------------------------------------------------------

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36';
const ACCEPT = {
  markdown: 'text/markdown, text/plain;q=0.9, text/html;q=0.8, */*;q=0.5',
  html: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
  json: 'application/json, */*;q=0.5',
};
const TIMEOUT_MS = 45_000;
const RETRY_DELAY_MS = 3_000;

// Some sites (Google devsite) bounce browser user agents through a sign-in
// redirect that only terminates once its cookies are sent back, so redirects
// are followed by hand with a small per-host cookie jar, as a browser would.
const cookieJar = new Map();

async function fetchOnce(url, accept) {
  let current = url;
  for (let hop = 0; hop < 10; hop++) {
    const host = new URL(current).hostname;
    const jar = cookieJar.get(host) ?? new Map();
    const headers = { 'user-agent': UA, accept, 'accept-language': 'en-US,en;q=0.9' };
    if (jar.size) headers.cookie = [...jar].map(([k, v]) => `${k}=${v}`).join('; ');
    const res = await fetch(current, { headers, redirect: 'manual', signal: AbortSignal.timeout(TIMEOUT_MS) });
    for (const line of res.headers.getSetCookie()) {
      const [pair] = line.split(';');
      const eq = pair.indexOf('=');
      if (eq > 0) jar.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim());
    }
    cookieJar.set(host, jar);
    const location = res.headers.get('location');
    if (res.status >= 300 && res.status < 400 && location) {
      await res.body?.cancel();
      current = new URL(location, current).href;
      continue;
    }
    const body = await res.text();
    return { status: res.status, url: current, contentType: res.headers.get('content-type') ?? '', body };
  }
  throw new Error('too many redirects');
}

// One retry, because pricing pages occasionally time out or 5xx.
async function fetchWithRetry(url, accept) {
  let lastError;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      const res = await fetchOnce(url, accept);
      if (res.status >= 200 && res.status < 300) return res;
      lastError = new Error(`HTTP ${res.status}`);
    } catch (err) {
      lastError = new Error(err.name === 'TimeoutError' ? `timed out after ${TIMEOUT_MS / 1000}s` : err.cause?.message ?? err.message);
    }
    if (attempt === 1) await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
  }
  throw new Error(`${lastError.message} (after 2 attempts)`);
}

const fetchCache = new Map();
function getText(url, accept) {
  if (!fetchCache.has(url)) fetchCache.set(url, fetchWithRetry(url, accept));
  return fetchCache.get(url);
}

class FetchError extends Error {}
class NotFound extends Error {}

async function loadSource(name) {
  const src = SOURCES[name];
  let res;
  try {
    res = await getText(src.url, ACCEPT[src.format]);
  } catch (err) {
    throw new FetchError(`could not fetch ${src.url}: ${err.message}`);
  }
  // A docs site that stops serving markdown would otherwise look like a layout change.
  if (src.format === 'markdown' && /text\/html/.test(res.contentType)) {
    throw new FetchError(`${src.url} returned HTML instead of markdown. Find a new markdown URL for this source.`);
  }
  return res.body;
}

// ---------------------------------------------------------------------------
// Parsing helpers
// ---------------------------------------------------------------------------

const ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', le: '≤', ge: '≥' };
function decodeEntities(s) {
  return s.replace(/&(#x[0-9a-f]+|#\d+|[a-z]+);/gi, (m, e) => {
    if (e[0] === '#') return String.fromCodePoint(e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10));
    return ENTITIES[e.toLowerCase()] ?? m;
  });
}

// Visible text of an HTML page as a list of segments, one per text node.
function htmlSegments(html) {
  const stripped = html
    .replace(/<script\b[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style\b[\s\S]*?<\/style>/gi, ' ')
    .replace(/<svg\b[\s\S]*?<\/svg>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ');
  return stripped
    .split(/<[^>]+>/)
    .map((s) => decodeEntities(s).replace(/\s+/g, ' ').trim())
    .filter(Boolean);
}

const PRICE_RE = /\$\s*(\d[\d,]*(?:\.\d+)?|\.\d+)/;
function firstPrice(text) {
  const m = PRICE_RE.exec(text);
  return m ? Number(m[1].replace(/,/g, '')) : null;
}

const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
function longDate(iso) {
  const [y, m, d] = iso.split('-').map(Number);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
}
function priceStarting(text, iso) {
  const re = new RegExp(PRICE_RE.source + '\\s+starting\\s+' + longDate(iso).replace(/ /g, '\\s+'));
  const m = re.exec(text);
  return m ? Number(m[1].replace(/,/g, '')) : null;
}

const plain = (s) =>
  s
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[`*]/g, '')
    .replace(/\\(.)/g, '$1')
    .replace(/\s+/g, ' ')
    .trim();

// Markdown headings with their line positions, ignoring fenced code blocks.
function headings(lines) {
  const out = [];
  let fenced = false;
  lines.forEach((line, i) => {
    if (/^\s*(```|~~~)/.test(line)) fenced = !fenced;
    const m = !fenced && /^(#{1,6})\s+(.*?)\s*#*\s*$/.exec(line);
    if (m) out.push({ line: i, level: m[1].length, text: plain(m[2]) });
  });
  return out;
}

function findSection(md, step) {
  let start = 0;
  if (step.after) {
    const i = md.indexOf(step.after);
    if (i < 0) throw new NotFound(`text "${step.after}" not found`);
    start = i + step.after.length;
  }
  const before = md.slice(0, start).split('\n').length - 1;
  const lines = md.split('\n');
  const hs = headings(lines);
  for (const [n, h] of hs.entries()) {
    if (h.line < before || h.text !== step.heading) continue;
    const next = hs.slice(n + 1).find((x) => x.level <= h.level);
    const text = lines.slice(h.line, next ? next.line : lines.length).join('\n');
    if (step.contains && !text.includes(step.contains)) continue;
    return text;
  }
  const where = [step.after && `after "${step.after}"`, step.contains && `containing ${step.contains}`].filter(Boolean).join(', ');
  throw new NotFound(`heading "${step.heading}"${where ? ` (${where})` : ''} not found`);
}

const narrow = (md, path = []) => path.reduce((text, step) => findSection(text, step), md);

function splitRow(line) {
  const cells = line.trim().split(/(?<!\\)\|/).map((c) => c.trim());
  return cells.slice(1, cells.at(-1) === '' ? -1 : undefined);
}

function tables(md) {
  const out = [];
  let block = [];
  for (const line of [...md.split('\n'), '']) {
    if (line.trim().startsWith('|')) {
      block.push(line);
      continue;
    }
    if (block.length >= 2 && /^[\s|:-]+$/.test(block[1])) {
      out.push({ header: splitRow(block[0]).map(plain), rows: block.slice(2).map((l) => ({ line: l.trim(), cells: splitRow(l) })) });
    }
    block = [];
  }
  return out;
}

const clip = (s, n = 240) => (s.length > n ? s.slice(0, n) + '...' : s);
const pathLabel = (path = []) => path.map((s) => s.heading).join(' > ');

// ---------------------------------------------------------------------------
// Locators. Each returns { found: { label: number | null }, context }.
// ---------------------------------------------------------------------------

function locateTable(md, t, labels) {
  const section = narrow(md, t.path);
  const found = {};
  const where = pathLabel(t.path);
  if (t.row) {
    for (const table of tables(section)) {
      const key = t.keyCol ? table.header.indexOf(t.keyCol) : 0;
      if (key < 0) continue;
      const row = table.rows.find((r) => plain(r.cells[key] ?? '') === t.row);
      if (!row) continue;
      for (const label of labels) {
        const col = table.header.indexOf(label);
        if (col < 0) throw new NotFound(`column "${label}" not found in the table with row ${t.row} under "${where}"`);
        found[label] = firstPrice(row.cells[col] ?? '');
      }
      return { found, context: clip(row.line) };
    }
    throw new NotFound(`row "${t.row}" not found under "${where}"`);
  }
  for (const table of tables(section)) {
    const col = table.header.indexOf(t.col);
    if (col < 0) continue;
    const context = [];
    for (const label of labels) {
      const row = table.rows.find((r) => plain(r.cells[0] ?? '') === label);
      if (!row) throw new NotFound(`row "${label}" not found under "${where}"`);
      const cell = row.cells[col] ?? '';
      found[label] = t.starting ? priceStarting(cell, t.starting) : firstPrice(cell);
      context.push(clip(row.line, 160));
    }
    return { found, context: context.join('\n') };
  }
  throw new NotFound(`no table with column "${t.col}" under "${where}"`);
}

function locateCard(html, c, labels) {
  const segs = htmlSegments(html);
  const window = 40;
  for (let i = 0; i < segs.length; i++) {
    if (segs[i] !== c.title) continue;
    let end = i + 1;
    while (end < segs.length && end < i + 1 + window && !(c.end && c.end.test(segs[end]))) end++;
    const card = segs.slice(i, end);
    if (!labels.every((l) => card.includes(l))) continue;
    if (c.mustContain && !card.includes(c.mustContain)) {
      throw new NotFound(`card "${c.title}" no longer says "${c.mustContain}"`);
    }
    const found = {};
    for (const label of labels) {
      const at = card.indexOf(label);
      // Stop at the next label so a missing value is not read from its neighbour.
      const after = card.slice(at + 1);
      const nextLabel = after.findIndex((s) => labels.includes(s));
      const scan = c.pick === 'before' ? card.slice(1, at).reverse() : nextLabel < 0 ? after : after.slice(0, nextLabel);
      const seg = scan.find((s) => firstPrice(s) !== null);
      found[label] = seg ? firstPrice(seg) : null;
    }
    return { found, context: clip(card.join(' | '), 400) };
  }
  throw new NotFound(`card "${c.title}" with labels ${labels.map((l) => `"${l}"`).join(', ')} not found`);
}

function locatePattern(text, isHtml, p, patterns) {
  const section = isHtml ? htmlSegments(text).join(' | ') : narrow(text, p.path);
  const found = {};
  const context = [];
  for (const [label, re] of Object.entries(patterns)) {
    const m = re.exec(section);
    if (!m) throw new NotFound(`pattern ${re} not found${p.path ? ` under "${pathLabel(p.path)}"` : ''}`);
    found[label] = Number(m[1].replace(/,/g, ''));
    const at = m.index;
    context.push(clip(section.slice(Math.max(0, at - 60), at + m[0].length + 60).replace(/\s+/g, ' ').trim(), 200));
  }
  return { found, context: context.join('\n') };
}

// Bedrock cells look like {priceOf!bedrockfoundationmodels/bedrockfoundationmodels!<id>}.
// The page fetches .../meteredUnitMaps/<service>/USD/current/<map>.json and
// reads regions[<region>][<id>].price; we do the same.
async function locateBedrock(html, b) {
  const segs = htmlSegments(html);
  const found = {};
  const context = [];
  for (const [key, label] of Object.entries(b.tables)) {
    const head = segs.findIndex(
      (s, i) => s === label && segs[i + 1] === '{regionSelector}' && segs[i + 2] === 'Anthropic models' && segs[i + 3] === 'Price per 1M input tokens',
    );
    if (head < 0) throw new NotFound(`Anthropic on-demand table "${label}" not found`);
    let tableEnd = segs.indexOf('{regionSelector}', head + 2);
    if (tableEnd < 0) tableEnd = segs.length;
    const row = segs.indexOf(b.model, head);
    if (row < 0 || row > tableEnd) throw new NotFound(`row "${b.model}" not found in "${label}"`);
    const cells = segs.slice(row + 1, row + 3);
    for (const [n, cell] of cells.entries()) {
      const name = `${key} ${n === 0 ? 'input' : 'output'}`;
      const literal = firstPrice(cell);
      if (literal !== null) {
        found[name] = literal;
        continue;
      }
      const m = /\{priceOf!([^/!}]+)\/([^!}]+)!([^!}]+)/.exec(cell);
      if (!m) throw new NotFound(`unexpected cell for ${name}: ${cell}`);
      const [, service, map, id] = m;
      const jsonUrl = `${SOURCES.bedrock.priceJsonBase}/${service}/USD/current/${map}.json`;
      let data;
      try {
        data = JSON.parse((await getText(jsonUrl, ACCEPT.json)).body);
      } catch (err) {
        throw new FetchError(`could not load ${jsonUrl}: ${err.message}`);
      }
      const entry = data.regions?.[b.region]?.[id];
      if (!entry) throw new NotFound(`price id ${id} has no entry for ${b.region} in ${jsonUrl}`);
      found[name] = Number(entry.price);
    }
    context.push(`${label}, ${b.region}: ${b.model} input ${fmt(found[`${key} input`])}, output ${fmt(found[`${key} output`])}`);
  }
  return { found, context: context.join('\n') };
}

// ---------------------------------------------------------------------------
// Running checks
// ---------------------------------------------------------------------------

const PRICE_FIELDS = ['in', 'out', 'cacheRead', 'cacheWrite'];
const nearlyEqual = (a, b) => Math.abs(a - b) < 1e-9;
const todayUtc = () => new Date().toISOString().slice(0, 10);

function fmt(n, unit = '$', none = 'no price') {
  if (n === null || n === undefined) return none;
  if (unit === '%') return `${n}%`;
  const s = Number.isInteger(n) ? String(n) : String(Number(n.toFixed(6)));
  const decimals = s.includes('.') ? s.split('.')[1].length : 0;
  return '$' + (Number.isInteger(n) ? s : n.toFixed(Math.max(2, decimals)));
}

function describe(check) {
  if (check.price) return prices[check.price].id;
  if (check.scheduled) return `${prices[check.scheduled].id} from ${prices[check.scheduled].next.from}`;
  return check.name;
}

// Turns `price` + `fields` into the same { label: expected } shape as `expect`.
function expectations(check) {
  if (!check.price) return check.expect;
  const p = prices[check.price];
  return Object.fromEntries(Object.entries(check.fields).map(([label, field]) => [label, p[field]]));
}

async function runCheck(check) {
  const name = describe(check);
  const source = SOURCES[check.source];
  const base = { name, url: source.url, unit: check.unit ?? '$' };
  const expect = expectations(check);
  const labels = Object.keys(expect);
  const none = check.table?.starting ? `no price "starting ${longDate(check.table.starting)}"` : 'no price';

  if (check.scheduled) {
    const from = prices[check.scheduled].next.from;
    if (todayUtc() >= from) {
      return {
        ...base,
        status: 'FAIL',
        message: `scheduled change took effect on ${from}. Move next.in/next.out into in/out for prices.${check.scheduled} and remove next.`,
        context: '',
      };
    }
  }

  try {
    const body = await loadSource(check.source);
    let loc;
    if (check.table) loc = locateTable(body, check.table, labels);
    else if (check.card) loc = locateCard(body, check.card, labels);
    else if (check.pattern) loc = locatePattern(body, source.format === 'html', check.pattern, check.patterns);
    else if (check.bedrock) loc = await locateBedrock(body, check.bedrock);
    else throw new Error(`check "${name}" has no locator`);

    const values = labels.map((label) => {
      const want = expect[label];
      const got = loc.found[label];
      // undefined or 0 in sample-data means the page should list no price.
      const ok = want === undefined || want === 0 ? got === null || got === 0 : got !== null && nearlyEqual(got, want);
      return { label, want, got, ok };
    });
    const bad = values.filter((v) => !v.ok);
    return {
      ...base,
      status: bad.length ? 'FAIL' : 'PASS',
      values,
      message: bad.length
        ? bad.map((v) => `${v.label}: expected ${fmt(v.want, base.unit)}, found ${fmt(v.got, base.unit, none)}`).join('; ')
        : values.map((v) => `${v.label} ${fmt(v.got, base.unit)}`).join(', '),
      context: loc.context,
    };
  } catch (err) {
    if (err instanceof FetchError) return { ...base, status: 'ERROR', message: err.message, context: '' };
    if (err instanceof NotFound) {
      return { ...base, status: 'FAIL', message: `${err.message}. The page layout may have changed: fix this check's rule in scripts/check-prices.mjs.`, context: '' };
    }
    return { ...base, status: 'FAIL', message: `unexpected error: ${err.stack ?? err}`, context: '' };
  }
}

// Every model, field and scheduled change in sample-data needs a check, so a
// price added later cannot go unverified.
function coverageProblems() {
  const problems = [];
  for (const [key, p] of Object.entries(prices)) {
    const check = CHECKS.find((c) => c.price === key);
    if (!check) {
      problems.push(`prices.${key} (${p.id}) has no check in scripts/check-prices.mjs`);
      continue;
    }
    const mapped = new Set(Object.values(check.fields));
    for (const f of PRICE_FIELDS) {
      if (p[f] !== undefined && !mapped.has(f)) problems.push(`prices.${key}.${f} is not checked`);
    }
    if (p.next && !CHECKS.some((c) => c.scheduled === key)) problems.push(`prices.${key}.next (scheduled change) is not checked`);
  }
  return problems;
}

// ---------------------------------------------------------------------------
// Report
// ---------------------------------------------------------------------------

function textReport(results, counts, date) {
  const width = Math.max(...results.map((r) => r.name.length));
  const lines = [`ModelPar price check, ${date} UTC. Expected values come from src/content/sample-data.ts.`, ''];
  for (const r of results) {
    lines.push(`${r.status.padEnd(5)}  ${r.name.padEnd(width)}  ${r.message}`);
    if (r.status !== 'PASS') {
      lines.push(`       ${''.padEnd(width)}  source: ${r.url}`);
      for (const c of (r.context ?? '').split('\n').filter(Boolean)) lines.push(`       ${''.padEnd(width)}  found: ${c}`);
    }
  }
  lines.push('', `Summary: ${counts.PASS} PASS, ${counts.FAIL} FAIL, ${counts.ERROR} ERROR`);
  return lines.join('\n');
}

function markdownReport(results, counts, date) {
  const cell = (s) => String(s).replace(/\|/g, '\\|').replace(/\n/g, ' ');
  const out = [
    `## Price check: ${date}`,
    '',
    `**Result:** ${counts.FAIL} FAIL, ${counts.ERROR} ERROR, ${counts.PASS} PASS`,
    '',
    'Expected values come from `src/content/sample-data.ts`.',
    '',
    '| Status | Check | Detail | Source |',
    '| --- | --- | --- | --- |',
    ...results.map((r) => `| ${r.status} | ${cell(r.name)} | ${cell(r.message)} | ${r.url} |`),
  ];
  const problems = results.filter((r) => r.status !== 'PASS');
  if (problems.length) {
    out.push('', '### Details');
    for (const r of problems) {
      out.push('', `**${r.status}: ${r.name}**`, '', r.message, '', `Source: ${r.url}`);
      if (r.context) out.push('', 'What the page shows:', '', '```', r.context, '```');
    }
    out.push(
      '',
      '### What to do',
      '',
      '- A price really changed: update `src/content/sample-data.ts`. Every number on /sample is recomputed at build time.',
      '- A row, section or label was not found: the page layout changed. Fix that check in the `CHECKS` table in `scripts/check-prices.mjs`.',
      '- ERROR: the page could not be fetched. Re-run the workflow. If it repeats, open the URL in a browser.',
    );
  }
  const { GITHUB_SERVER_URL: server, GITHUB_REPOSITORY: repo, GITHUB_RUN_ID: run } = process.env;
  if (server && repo && run) out.push('', `Run: ${server}/${repo}/actions/runs/${run}`);
  return out.join('\n') + '\n';
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function writeDate(date) {
  const file = new URL('../src/content/sample-data.ts', import.meta.url);
  const src = await readFile(file, 'utf8');
  const re = /pricesCheckedOn: '\d{4}-\d{2}-\d{2}'/g;
  const matches = src.match(re) ?? [];
  if (matches.length !== 1) throw new Error(`expected exactly one pricesCheckedOn line in sample-data.ts, found ${matches.length}`);
  if (sampleMeta.pricesCheckedOn === date) return `pricesCheckedOn is already ${date}.`;
  await writeFile(file, src.replace(re, `pricesCheckedOn: '${date}'`));
  return `pricesCheckedOn updated from ${sampleMeta.pricesCheckedOn} to ${date}.`;
}

function parseArgs(argv) {
  const args = { writeDate: false, markdown: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--write-date') args.writeDate = true;
    else if (argv[i] === '--markdown') {
      args.markdown = argv[++i];
      if (!args.markdown) throw new Error('--markdown needs a file path');
    } else throw new Error(`unknown argument: ${argv[i]}`);
  }
  return args;
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const date = todayUtc();
  const results = await Promise.all(CHECKS.map(runCheck));
  for (const problem of coverageProblems()) {
    results.push({ name: 'coverage', url: 'scripts/check-prices.mjs', status: 'FAIL', message: problem, context: '' });
  }
  const counts = { PASS: 0, FAIL: 0, ERROR: 0 };
  for (const r of results) counts[r.status]++;

  console.log(textReport(results, counts, date));
  if (args.markdown) await writeFile(args.markdown, markdownReport(results, counts, date));

  const code = counts.FAIL ? 1 : counts.ERROR ? 2 : 0;
  if (args.writeDate) console.log(code === 0 ? await writeDate(date) : 'Not updating pricesCheckedOn: not every check passed.');
  return code;
}

main().then(
  (code) => process.exit(code),
  (err) => {
    console.error(err);
    process.exit(1);
  },
);

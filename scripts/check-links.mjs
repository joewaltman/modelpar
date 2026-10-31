#!/usr/bin/env node
// Checks the outbound links the site shows: every exportLinks URL in
// src/content/copy.ts and every pricing page cited in sample-data.ts.
//
//   OK       2xx at the same address
//   WARN     redirected to a different host or path (final URL printed), or
//            an unexpected status or network error worth a look
//   SKIPPED  401/403/429 from a host known to block scripts: check in a browser
//   FAIL     404 or 410
//
// Exit code 1 only when something FAILs.

import { exportLinks } from '../src/content/copy.ts';
import { prices, seats } from '../src/content/sample-data.ts';

// These return 401/403/429 to non-browser clients even when the page is fine.
const BOT_BLOCKING_HOSTS = new Set(['help.openai.com', 'chatgpt.com', 'platform.openai.com', 'openai.com']);
const BLOCKED_STATUSES = new Set([401, 403, 429]);
const GONE_STATUSES = new Set([404, 410]);

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36';
const TIMEOUT_MS = 30_000;
const RETRY_DELAY_MS = 3_000;
const CONCURRENCY = 6;

function collectLinks() {
  const links = new Map();
  const add = (url, where) => {
    if (!links.has(url)) links.set(url, []);
    links.get(url).push(where);
  };
  for (const [key, group] of Object.entries(exportLinks)) {
    for (const link of group.links) add(link.href, `exportLinks.${key}: ${link.label}`);
  }
  for (const [key, p] of Object.entries(prices)) add(p.page, `prices.${key}.page`);
  for (const [key, url] of Object.entries(seats.seatPages)) add(url, `seats.seatPages.${key}`);
  return links;
}

// Redirects are followed by hand so the final URL is known and so sign-in
// bounces that rely on cookies (Google devsite) complete as in a browser.
async function fetchOnce(url) {
  const cookieJar = new Map();
  let current = url;
  for (let hop = 0; hop < 10; hop++) {
    const host = new URL(current).hostname;
    const jar = cookieJar.get(host) ?? new Map();
    const headers = {
      'user-agent': UA,
      accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      'accept-language': 'en-US,en;q=0.9',
    };
    if (jar.size) headers.cookie = [...jar].map(([k, v]) => `${k}=${v}`).join('; ');
    const res = await fetch(current, { headers, redirect: 'manual', signal: AbortSignal.timeout(TIMEOUT_MS) });
    for (const line of res.headers.getSetCookie()) {
      const [pair] = line.split(';');
      const eq = pair.indexOf('=');
      if (eq > 0) jar.set(pair.slice(0, eq).trim(), pair.slice(eq + 1).trim());
    }
    cookieJar.set(host, jar);
    await res.body?.cancel();
    const location = res.headers.get('location');
    if (res.status >= 300 && res.status < 400 && location) {
      current = new URL(location, current).href;
      continue;
    }
    return { status: res.status, finalUrl: current };
  }
  throw new Error('too many redirects');
}

// One retry for network errors and 5xx, which are usually transient.
async function check(url) {
  let result;
  for (let attempt = 1; attempt <= 2; attempt++) {
    try {
      result = await fetchOnce(url);
      if (result.status < 500) break;
    } catch (err) {
      result = { error: err.name === 'TimeoutError' ? `timed out after ${TIMEOUT_MS / 1000}s` : err.cause?.message ?? err.message };
    }
    if (attempt === 1) await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
  }
  return classify(url, result);
}

const place = (u) => {
  const x = new URL(u);
  return x.hostname.replace(/^www\./, '') + (x.pathname.replace(/\/+$/, '') || '/');
};

function classify(url, r) {
  if (r.error) {
    // chatgpt.com, for one, sends headers too large for Node's HTTP parser.
    if (BOT_BLOCKING_HOSTS.has(new URL(url).hostname)) {
      return { status: 'SKIPPED', code: '-', note: `request failed (${r.error}), host blocks scripts, check in a browser` };
    }
    return { status: 'WARN', code: '-', note: `request failed: ${r.error}` };
  }
  const moved = place(url) !== place(r.finalUrl);
  const via = moved ? ` (redirected to ${r.finalUrl})` : '';
  const hosts = [new URL(url).hostname, new URL(r.finalUrl).hostname];
  if (GONE_STATUSES.has(r.status)) return { status: 'FAIL', code: r.status, note: `not found${via}` };
  if (BLOCKED_STATUSES.has(r.status) && hosts.some((h) => BOT_BLOCKING_HOSTS.has(h))) {
    return { status: 'SKIPPED', code: r.status, note: `host blocks scripts, check in a browser${via}` };
  }
  if (r.status >= 200 && r.status < 300) {
    return moved ? { status: 'WARN', code: r.status, note: `redirected to ${r.finalUrl}` } : { status: 'OK', code: r.status, note: '' };
  }
  return { status: 'WARN', code: r.status, note: `unexpected status${via}` };
}

async function pool(items, size, fn) {
  const out = new Array(items.length);
  let next = 0;
  const worker = async () => {
    while (next < items.length) {
      const i = next++;
      out[i] = await fn(items[i]);
    }
  };
  await Promise.all(Array.from({ length: Math.min(size, items.length) }, worker));
  return out;
}

async function main() {
  const links = collectLinks();
  const urls = [...links.keys()];
  const results = await pool(urls, CONCURRENCY, check);
  const counts = { OK: 0, WARN: 0, SKIPPED: 0, FAIL: 0 };

  console.log(`ModelPar link check, ${new Date().toISOString().slice(0, 10)} UTC. ${urls.length} URLs.\n`);
  results.forEach((r, i) => {
    counts[r.status]++;
    console.log(`${r.status.padEnd(7)}  ${String(r.code).padEnd(3)}  ${urls[i]}`);
    if (r.note) console.log(`              ${r.note}`);
    console.log(`              used in: ${links.get(urls[i]).join('; ')}`);
  });
  console.log(`\nSummary: ${counts.OK} OK, ${counts.WARN} WARN, ${counts.SKIPPED} SKIPPED, ${counts.FAIL} FAIL`);
  return counts.FAIL ? 1 : 0;
}

main().then(
  (code) => process.exit(code),
  (err) => {
    console.error(err);
    process.exit(1);
  },
);

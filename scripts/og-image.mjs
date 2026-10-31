// Renders public/og.png (1200x630), public/favicon-32.png and public/apple-touch-icon.png
// with Playwright, using the site's own fonts, colors and sample numbers.
// Run: npm run og
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { prices, workloads, scenarios, tiers } from '../src/content/sample-data.ts';

const root = fileURLToPath(new URL('..', import.meta.url));
const font = (f) => 'data:font/woff2;base64,' + readFileSync(root + 'public/fonts/' + f).toString('base64');
const logoSrc = readFileSync(root + 'src/components/logo-paths.ts', 'utf8');
const L = {
  width: +logoSrc.match(/width: (\d+)/)[1],
  height: +logoSrc.match(/height: (\d+)/)[1],
  text: logoSrc.match(/text: '([^']+)'/)[1],
  bars: Object.fromEntries([...logoSrc.match(/bars: \{([^}]+)\}/)[1].matchAll(/(\w+): ([\d.]+)/g)].map((m) => [m[1], +m[2]])),
};

const inCost = (p, t) => t.u * p.in + (t.r ?? 0) * (p.cacheRead ?? p.in) + (t.w ?? 0) * (p.cacheWrite ?? p.in);
const effIn = (p, t) => inCost(p, t) / (t.u + (t.r ?? 0) + (t.w ?? 0));
const usd2 = (n) => '$' + n.toFixed(2);
const rows = [
  ['Support agent', prices.sonnet.id, prices.sonnet.in, effIn(prices.sonnet, workloads.support.t), effIn(prices.sonnet, scenarios.supportCachingFixed)],
  ['Contract extraction', prices.sol.id, prices.sol.in, effIn(prices.sol, workloads.extract.t), effIn(prices.sol, workloads.extract.t) * tiers.batchFactor],
  ['Call summaries', prices.flash.id, prices.flash.in, effIn(prices.flash, workloads.calls.t), prices.flashLite31.in],
];

const logo = (h, ink, accent) => {
  const w = (L.width / L.height) * h;
  const b = L.bars;
  return `<svg viewBox="0 0 ${L.width} ${L.height}" width="${w}" height="${h}"><rect x="${b.x}" y="${b.y1}" width="${b.w}" height="${b.h}" rx="${b.r}" fill="${ink}"/><rect x="${b.x}" y="${b.y2}" width="${b.w}" height="${b.h}" rx="${b.r}" fill="${accent}"/><path d="${L.text}" fill="${ink}"/></svg>`;
};

const og = `<!doctype html><html><head><style>
@font-face{font-family:Geist;src:url(${font('geist-latin.woff2')}) format('woff2');font-weight:100 900}
@font-face{font-family:'Geist Mono';src:url(${font('geist-mono-latin.woff2')}) format('woff2');font-weight:100 900}
*{box-sizing:border-box;margin:0}
body{width:1200px;height:630px;background:#FAFAF8;color:#171715;font-family:Geist;font-variant-numeric:tabular-nums;padding:64px 72px;display:flex;flex-direction:column;justify-content:space-between}
.mono{font-family:'Geist Mono'}
.top{display:flex;justify-content:space-between;align-items:center}
.main{display:grid;grid-template-columns:1fr 470px;gap:56px;align-items:center}
h1{font-size:66px;line-height:1.02;letter-spacing:-0.035em;font-weight:600}
.sub{margin-top:24px;font-size:25px;line-height:1.4;color:#5E5E58}
.card{background:#fff;border:1px solid #E4E3DE;border-radius:10px}
.card-h{display:flex;justify-content:space-between;padding:14px 20px;border-bottom:1px solid #E4E3DE;font-size:14px;color:#5E5E58}
.card-b{padding:16px 20px 8px}
.t{font-size:16px;font-weight:500;margin-bottom:10px}
table{width:100%;border-collapse:collapse}
th{font:500 12px 'Geist Mono';color:#5E5E58;text-align:right;padding:6px 0 8px;border-bottom:1px solid #CFCEC8}
th:first-child{text-align:left}
td{padding:11px 0;border-bottom:1px solid #E4E3DE;font-size:15px;vertical-align:top}
tr:last-child td{border-bottom:0}
td.n{text-align:right;font-family:'Geist Mono';font-size:15px}
.m{display:block;font-family:'Geist Mono';font-size:12px;color:#5E5E58;margin-top:2px}
.g{color:#0E6A45;font-weight:600}
.foot{display:flex;justify-content:space-between;font-size:18px;color:#5E5E58}
</style></head><body>
<div class="top">${logo(34, '#171715', '#0E6A45')}<span class="mono" style="font-size:17px;color:#5E5E58">Free AI bill teardown</span></div>
<div class="main">
  <div><h1>Find out if you're overpaying for AI.</h1><p class="sub">A one-page teardown of your AI bill in 48&nbsp;hours. No API keys.</p></div>
  <div class="card"><div class="card-h"><span class="mono">Input price per 1M tokens</span><span class="mono">Example Co.</span></div>
  <div class="card-b"><table><thead><tr><th>Workload</th><th>List</th><th>Paying</th><th>Could pay</th></tr></thead><tbody>
  ${rows.map(([w, m, l, p, c]) => `<tr><td>${w}<span class="m">${m}</span></td><td class="n" style="color:#5E5E58">${usd2(l)}</td><td class="n">${usd2(p)}</td><td class="n g">${usd2(c)}</td></tr>`).join('')}
  </tbody></table></div></div>
</div>
<div class="foot"><span class="mono">modelpar.com</span><span class="mono">Sample numbers, illustrative</span></div>
</body></html>`;

const icon = (size) => `<!doctype html><html><body style="margin:0;background:transparent">
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="${size}" height="${size}"><rect width="32" height="32" rx="7" fill="#171715"/><rect x="7" y="10.2" width="18" height="4.4" rx="2.2" fill="#FAFAF8"/><rect x="7" y="17.4" width="18" height="4.4" rx="2.2" fill="#5CC495"/></svg></body></html>`;

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
await page.setContent(og, { waitUntil: 'load' });
await page.evaluate(() => document.fonts.ready);
await page.screenshot({ path: root + 'public/og.png', type: 'png' });
for (const [size, file, bg] of [
  [32, 'favicon-32.png', false],
  [180, 'apple-touch-icon.png', true],
]) {
  const p = await browser.newPage({ viewport: { width: size, height: size } });
  // Apple touch icons get a full-bleed square; iOS rounds the corners itself.
  const html = bg
    ? icon(size).replace('rx="7"', 'rx="0"')
    : icon(size);
  await p.setContent(html);
  await p.screenshot({ path: root + 'public/' + file, omitBackground: !bg, clip: { x: 0, y: 0, width: size, height: size } });
}
await browser.close();
console.log('Wrote public/og.png, public/favicon-32.png, public/apple-touch-icon.png');

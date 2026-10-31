// Full-page screenshots of every page at 1440px and 375px, light and dark.
// Usage: npm run screenshots -- [baseUrl] [--chunks]
// Start the site first (npm run dev). Output goes to screenshots/ (git-ignored).
import { chromium } from 'playwright';
import { mkdirSync } from 'node:fs';

const args = process.argv.slice(2);
const base = args.find((a) => a.startsWith('http')) ?? 'http://localhost:4321';
const chunks = args.includes('--chunks');
const out = new URL('../screenshots/', import.meta.url).pathname;
mkdirSync(out + 'chunks', { recursive: true });

const pages = [
  ['home', '/'],
  ['sample', '/sample'],
  ['privacy', '/privacy'],
  ['terms', '/terms'],
  ['404', '/this-page-does-not-exist'],
];
const widths = [
  [1440, 900],
  [375, 812],
];
const themes = ['light', 'dark'];

const browser = await chromium.launch();
for (const [w, h] of widths) {
  for (const theme of themes) {
    const ctx = await browser.newContext({ viewport: { width: w, height: h }, colorScheme: theme, deviceScaleFactor: 1 });
    const page = await ctx.newPage();
    for (const [name, path] of pages) {
      await page.goto(base + path, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      const file = `${name}-${w}-${theme}.png`;
      await page.screenshot({ path: out + file, fullPage: true });
      const scrollW = await page.evaluate(() => document.documentElement.scrollWidth);
      const total = await page.evaluate(() => document.documentElement.scrollHeight);
      if (scrollW > w) console.warn(`  horizontal overflow on ${name} at ${w}px: ${scrollW}px`);
      if (chunks) {
        const step = w > 800 ? 1300 : 1500;
        for (let y = 0, i = 0; y < total; y += step, i++) {
          await page.screenshot({
            path: `${out}chunks/${name}-${w}-${theme}-${String(i).padStart(2, '0')}.png`,
            fullPage: true,
            clip: { x: 0, y, width: w, height: Math.min(step, total - y) },
          });
        }
      }
      console.log(file, `${w}x${total}`);
    }

    // Form confirmation state (works in dev, where the form isn't connected yet).
    await page.goto(base + '/#get-started', { waitUntil: 'networkidle' });
    await page.fill('#f-name', 'Ada Lovelace');
    await page.fill('#f-email', 'ada@example.com');
    await page.fill('#f-company', 'Example Co.');
    await page.check('input[name="providers"][value="anthropic"]');
    await page.check('input[name="providers"][value="coding-agents"]');
    await page.check('input[name="spend"] >> nth=1');
    await page.click('#teardown-form button[type="submit"]');
    const confirmed = await page.isVisible('#teardown-confirmation');
    const el = await page.$(confirmed ? '#teardown-confirmation' : '#teardown-form');
    await el.screenshot({ path: `${out}form-confirmation-${w}-${theme}.png` });
    console.log(`form-confirmation-${w}-${theme}.png`, confirmed ? 'confirmed' : 'NOT CONFIRMED');
    await ctx.close();
  }
}
await browser.close();

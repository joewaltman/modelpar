# modelpar.com

Marketing site for ModelPar: free AI bill teardowns, the Comps pricing benchmark, model and effort maps, and negotiation at renewal.

Static site built with Astro and Tailwind. No server, no database, about 3KB of JavaScript per page.

## Run it locally

Needs Node 22.22 or newer (Node 24 recommended).

```bash
npm install
```

```bash
npm run dev
```

Open http://localhost:4321. Edits reload instantly.

To check the production build:

```bash
npm run build && npm run preview
```

## Where things live

| To change | Edit |
| --- | --- |
| Brand name, domain, email, form endpoint, founder details | `src/config.ts` |
| Every word on the site, including the sample report, form, legal pages and 404 | `src/content/copy.ts` |
| Sample report numbers: prices, token volumes, seats, engineers | `src/content/sample-data.ts` |
| How the sample numbers are calculated | `src/lib/sample.ts` |
| Colors, type, spacing, dark mode | `src/styles/global.css` |
| Page layout | `src/pages/*.astro` and `src/components/*.astro` |

Copy strings can use `{tokens}` such as `{totalSpend}` or `{company}`. They are filled from the computed sample figures, so changing a price in `sample-data.ts` updates every number that depends on it: tables, summary, hero card and copy.

## Before launch: fill these in

Only one placeholder is left: `formEndpoint` in `src/config.ts` (`[FORM_ENDPOINT]`). Until it is set, the form can't deliver submissions (see "Set up the form" below). `npm run check:copy` lists any bracketed placeholder that shows up on a page.

The founder photo is `public/joe-waltman.jpg` (398px square). To replace it, drop in a new square image and update `founder.photo` in `src/config.ts`.

The site shows no pricing for ModelPar's own services. Keep it that way unless that decision changes.

## Set up the form

The form posts to any endpoint that accepts a standard form POST and returns JSON. Formspree is the simplest:

1. Create a free account at formspree.io and a new form. Set the notification email to `joe@modelpar.com`.
2. Copy the endpoint, which looks like `https://formspree.io/f/abcdwxyz`.
3. Paste it into `formEndpoint` in `src/config.ts`.

Fields sent: `name`, `email`, `company`, `providers` (one entry per selected provider), `spend`, `renewal`, `notes`, plus `_subject` and a `_gotcha` honeypot for spam, both of which Formspree understands. Basin and Getform also work with the same field names.

Until the endpoint is set:

- In `npm run dev`, submitting shows the confirmation screen without sending anything, so you can test it.
- In a production build, the form shows a message asking people to email you instead. With JavaScript off, the form opens an email to `site.email`.

Successful submissions also record a `Teardown Request` event in Plausible. To see it, add a custom event goal with that name in Plausible.

## Analytics

Plausible, loaded only in production builds. It sets no cookies, so the site needs no cookie banner. Create the `modelpar.com` site in your Plausible account; the domain and script URL are in `site.analytics` in `src/config.ts`.

## Deploy

Push the repo to GitHub, then connect it to one host. Both deploy on every push to `main`.

### Vercel

1. vercel.com, Add New, Project, import `joewaltman/modelpar`.
2. Framework preset: Astro. Build command `npm run build`, output directory `dist`. These are detected automatically.
3. Deploy. `vercel.json` already turns on clean URLs, so `/sample` works without `.html`.

### Cloudflare Pages

1. Cloudflare dashboard, Workers and Pages, Create, Pages, connect to Git, pick the repo.
2. Framework preset: Astro. Build command `npm run build`, output directory `dist`.
3. Under Settings, Environment variables, set `NODE_VERSION` to `24`.

Cloudflare Pages serves `/sample` from `sample.html` without extra configuration.

## Point modelpar.com at the site

Wherever modelpar.com is registered, you either change DNS records or move the nameservers.

**Vercel:** Project, Settings, Domains, add `modelpar.com` and `www.modelpar.com`. Vercel shows the exact records to create, usually an `A` record for the apex (`@`) and a `CNAME` for `www`. Add them at your registrar. Set `modelpar.com` as the primary domain so `www` redirects to it. HTTPS is issued automatically once DNS resolves, typically within minutes.

**Cloudflare Pages:** this is easiest when the domain's DNS is on Cloudflare. Add the site to Cloudflare, switch the registrar's nameservers to the two Cloudflare gives you, then in the Pages project open Custom domains and add `modelpar.com` and `www.modelpar.com`. Cloudflare creates the records itself. Add a redirect rule from `www` to the apex.

After DNS changes, check with:

```bash
dig +short modelpar.com
```

Email for `joe@modelpar.com` uses separate `MX` records from your email provider. Don't delete them when editing DNS.

## Weekly price check

The sample report uses real list prices. `.github/workflows/prices.yml` runs every Monday at 15:00 UTC and can be run by hand from the Actions tab.

- It fetches each provider's pricing page (Anthropic, OpenAI, Google Gemini, Together AI, Cursor, AWS Bedrock) and compares every price in `src/content/sample-data.ts`.
- **All match:** it updates `pricesCheckedOn` and pushes. The host redeploys, and the sample page shows the new "List prices are real as of" date.
- **Something changed, or a page couldn't be read:** it opens an issue labelled `price-check` (or comments on the open one) showing expected and found values. Update the numbers in `sample-data.ts`, run `npm run check:prices`, and push. Every figure on the site recalculates.
- It also checks every outbound link (pricing pages and export guides) and reports broken ones in the run summary.

One-time setup: in the GitHub repo, Settings, Actions, General, make sure Actions are allowed. If the push step fails with a permissions error, set Workflow permissions to "Read and write permissions" on the same page.

Known dates: Gemini 3.8 Flash list prices rise on Jan 1, 2027. The first check after that date fails on purpose and reminds you to move `prices.flash.next` into `in` and `out`.

GitHub pauses scheduled workflows in public repos after 60 days without commits. The weekly commit keeps it running, but if checks start failing, re-enable the workflow in the Actions tab after fixing them.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Local dev server on port 4321 |
| `npm run build` | Production build into `dist/` |
| `npm run preview` | Serve the production build |
| `npm run check:copy` | Fails on em or en dashes and emoji anywhere in the repo, and on hype words or exclamation marks in the built pages. Lists placeholders still on the site. |
| `npm run check:prices` | Compares sample prices with the providers' live pricing pages. `--write-date` updates `pricesCheckedOn` when everything matches. |
| `npm run check:links` | Checks every outbound link used on the site |
| `npm run og` | Regenerates `public/og.png` and the PNG favicons from the sample data. Run it after changing hero card prices. |
| `npm run screenshots` | Full-page screenshots of every page at 1440px and 375px in light and dark mode, into `screenshots/`. Needs `npm run dev` running. Add `-- --chunks` for viewable segments. |

`og` and `screenshots` use Playwright. The first time, install its browser:

```bash
npx playwright install chromium
```

## House rules for copy

These are enforced by `npm run check:copy` where a script can check them.

- No em or en dashes anywhere: copy, code comments, metadata. Use colons, commas or periods.
- No hype words (revolutionize, supercharge, unlock, seamless, AI-powered), no emoji, no exclamation marks.
- Numbers as numerals with units: `48 hours`, `$250K`, `3 companies`.
- No customer logos, testimonials or usage stats until they are real.
- Show only commands, integrations and screenshots for things that exist.
- Nothing quoted or paraphrased from YC's Bookface forum.

## Other files

- `/.well-known/security.txt` is generated at build time from `src/pages/.well-known/security.txt.ts`. Its `Expires` date is about 11 months after each build.
- `public/brand/` has the wordmark (light and dark) and the mark as SVG.
- `public/fonts/` holds Geist and Geist Mono (SIL Open Font License, included alongside).
- `src/components/logo-paths.ts` holds the wordmark outlines. The mark is an equals sign with an accent green lower bar.

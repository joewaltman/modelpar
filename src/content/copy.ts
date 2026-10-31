// All site copy lives here. Edit text freely; layout is in src/components and src/pages.
//
// Rules: no em dashes, no hype words, no emoji, no exclamation marks.
// Run `npm run check:copy` before publishing.
//
// Text in [BRACKETS] is a placeholder. In the sample report, {tokens} such as
// {total} are filled from src/lib/sample.ts so numbers always match the data.

export const meta = {
  home: {
    title: "ModelPar: find out if you're overpaying for AI",
    description:
      'A free teardown of your AI bill in 48 hours. Then see what comparable startups pay and which model each task actually needs.',
  },
  sample: {
    title: 'Sample AI bill teardown: Example Co. | ModelPar',
    description:
      'A full sample of the one-page ModelPar teardown: spend by model, effective vs list price, savings, seat-vs-API math, routing card and billing hygiene.',
  },
  privacy: { title: 'Privacy | ModelPar', description: 'How ModelPar collects, uses and deletes data.' },
  terms: { title: 'Terms | ModelPar', description: 'Terms for using ModelPar and its services.' },
  notFound: { title: 'Page not found | ModelPar', description: 'This page does not exist.' },
};

export const nav = {
  links: [
    { label: 'How it works', href: '/#how-it-works' },
    { label: 'Sample report', href: '/sample' },
    { label: 'Pricing', href: '/#pricing' },
    { label: 'FAQ', href: '/#faq' },
  ],
  cta: { label: 'Get a free teardown', href: '/#get-started' },
  menu: 'Menu',
  skip: 'Skip to content',
  themeToggle: 'Toggle color theme',
};

export const hero = {
  audience: 'For startups spending $5K to $500K+ a month on AI',
  headline: "Find out if you're overpaying for AI.",
  subhead:
    'A free teardown of your AI bill in 48 hours. Then see what comparable startups pay and which model each task actually needs.',
  primary: { label: 'Get a free teardown', href: '#get-started' },
  secondary: { label: 'See a sample report', href: '/sample' },
  quiet: 'No API keys. Works from a console export.',
  card: {
    title: 'Input price per 1M tokens',
    meta: 'Example Co. · teardown v1',
    columns: ['Workload', 'List', 'Paying', 'Could pay'],
    rows: [
      { workload: 'Support agent', how: 'Fix prompt caching' },
      { workload: 'Contract extraction', how: 'Batch API' },
      { workload: 'Call summaries', how: 'Smaller model, to test' },
    ],
    caption: 'From the sample report. Numbers are illustrative.',
  },
};

export const problem = {
  label: 'The problem',
  heading: "There's no public par for AI spend.",
  lead: 'Your own bill is the only data point you see. That makes three problems hard to spot.',
  cards: [
    {
      title: 'List price is the only public number.',
      body: "Every provider publishes a rate card. Discounts, commits and credits are negotiated one company at a time and kept private, so you can't tell whether your terms are good, typical or bad.",
    },
    {
      title: 'Models get picked by habit.',
      body: 'Teams tend to use the model they started with, or whichever plan has limits left this week. Few test what each task needs, so simple work often runs on the most expensive model at the highest effort level.',
    },
    {
      title: 'Bills and quality change silently.',
      body: 'A retry loop runs all weekend. A "latest" alias moves to a new version. Credits stop applying. A host serves a quantized model under the name you pinned. You find out from the invoice, or from your users.',
    },
  ],
};

export const steps = {
  label: 'How it works',
  heading: 'Four steps. The first one is free.',
  lead: 'Each step stands on its own. Stop whenever the numbers stop being worth it.',
  fields: { give: 'You give', get: 'You get', time: 'Time', cost: 'Cost' },
  items: [
    {
      n: '01',
      title: 'Free AI bill teardown',
      summary: 'A one-page report on what you pay, what you could pay, and where it goes.',
      give: 'Usage and cost exports from each provider console. Seat counts and plans for coding agents. Your order form, if you have a commit.',
      get: [
        'Effective price per model vs list price, per million tokens',
        'Missed savings: prompt caching, batch pricing for async jobs',
        'Where spend concentrates, by model and workload',
        'Seat-vs-API math for coding agents',
        'Billing hygiene: hard limits, pinned model versions instead of "latest" aliases, credits that actually apply',
        'A routing card: task type, recommended model and effort level, cost per task, plan-limit headroom',
      ],
      time: '48 hours after we receive your exports',
      cost: 'Free',
      costIsKey: true,
    },
    {
      n: '02',
      title: 'ModelPar Comps',
      summary: 'An anonymized benchmark of what comparable startups actually pay.',
      give: 'Your current terms: provider, discount, commit, term, credits and offer date. Opt-in.',
      get: [
        'Discounts by provider and commit band, with term, credits and offer date',
        'A band is never shown with fewer than 3 companies',
      ],
      note: "Comps is new. Where a band doesn't have 3 companies yet, we say so instead of estimating.",
      time: 'Shared with your teardown',
      cost: 'Free for teams that contribute their terms',
      costIsKey: true,
    },
    {
      n: '03',
      title: 'Model and effort map',
      summary: 'For each task type, the cheapest model and effort level that passes on your own work.',
      give: 'For production: 30 to 50 representative tasks and what a good result looks like. For coding agents: 10 to 20 recently merged PRs.',
      get: [
        'A map from task type to model and effort level, scored on quality, cost and latency',
        'The same task set run nightly as a canary, to catch silent quality drift from quantization or version changes',
        'A refresh whenever a new model ships',
      ],
      details: [
        {
          term: 'Your tasks, your choice',
          text: 'Run production tasks in your own environment, and only scores, token counts and timings leave it. Or share them with us, so we can read the failures, tune the grading with you and explain why a model fell short, not just that it did.',
        },
        {
          term: 'How the PR replay works',
          text: 'Each PR is replayed per model and effort level on your machine. Only scores, token counts and timings leave it.',
        },
      ],
      time: '2 to 3 weeks for the first map, then nightly',
      cost: 'Pricing on request',
      costIsKey: false,
    },
    {
      n: '04',
      title: 'Negotiate at renewal',
      summary: 'A competitive process across labs and inference providers, for teams spending $250K+ a year.',
      give: 'Your current contract, usage history and renewal or commit date.',
      get: [
        'Competing offers from labs and inference providers, checked against Comps',
        'Your model map, showing which workloads can credibly move',
        'You make the final call on every term',
      ],
      time: 'Start 60 to 90 days before renewal',
      cost: '[20 to 30]% of first-year savings. No savings, no fee.',
      costIsKey: false,
    },
  ],
};

export const samplePreview = {
  label: 'Sample report',
  heading: 'One page you can forward to your CFO.',
  body: 'Every teardown uses the same format: dated, versioned and specific to your bill. This one was prepared for a fictional 14-engineer company.',
  link: 'Read the full sample report',
};

export const data = {
  label: 'Your data',
  heading: 'We need billing data, not access.',
  items: [
    { icon: 'file', title: 'Exports, not keys.', body: 'The teardown starts from usage and cost exports you download yourself. No API keys, no console access.' },
    {
      icon: 'eye-off',
      title: 'No prompts, code or customer data, unless you choose.',
      body: 'Usage exports hold token counts and dollars, not content. The teardown and Comps never see prompts, completions, code or customer records. For the model map, sharing production tasks is your call.',
    },
    { icon: 'laptop', title: 'The PR replay runs on your machine.', body: 'Only scores, token counts and timings leave it.' },
    { icon: 'trash', title: 'Deleted on request, or after 90 days.', body: 'Your files are deleted when you ask, and automatically 90 days after we receive them.' },
    {
      icon: 'users',
      title: 'Benchmark contributions are opt-in.',
      body: "Your terms join Comps only if you choose. They're stored without your company name, and no band is shown with fewer than 3 companies.",
    },
    { icon: 'signature', title: 'Mutual NDA available.', body: "We're happy to sign one before you send anything." },
  ],
  note: "Some exports include API key names, project names or user emails. You can delete those columns before sending. We don't need them.",
};

export const founder = {
  label: "Who's behind it",
  photoAlt: 'Joe Waltman',
  photoPlaceholder: 'Photo',
  bio: [
    'Joe was a YC W15 founder (VetPronto). Previously [roles]. [Earlier company acquired by Twitter, confirm wording].',
  ],
  early: "We're early and working with our first 10 teams.",
  linkedin: 'LinkedIn',
  email: 'Email',
};

export const pricing = {
  label: 'Pricing',
  heading: 'Start free. Pay only for ongoing work.',
  columns: ['Service', 'Price', 'Notes'],
  rows: [
    { service: 'Teardown', price: 'Free', key: true, notes: 'One-page report in 48 hours' },
    { service: 'Comps', price: 'Free for contributors', key: true, notes: 'Share your terms to see the full benchmark' },
    { service: 'Model and effort map, plus nightly canary', price: 'Pricing on request', key: false, notes: 'Refreshed when new models ship' },
    { service: 'Negotiation at renewal', price: '[20 to 30]% of first-year savings', key: false, notes: 'For teams spending $250K+ a year. No savings, no fee.' },
  ],
  footnote: "We don't resell credits. Savings are measured against your current effective rates at the same usage.",
};

export const faq = {
  label: 'FAQ',
  heading: 'Questions',
  items: [
    {
      q: 'How is this different from AI spend dashboards?',
      a: 'Dashboards show where your money went. We tell you what you should be paying and which model each task needs. We work alongside them: if you already use one, its export is a fine starting point for the teardown.',
    },
    {
      q: 'Do you need API keys?',
      a: "No. The teardown and Comps work from usage and cost exports you download from each provider's console. You never hand over keys or console access to get started.",
    },
    { q: 'Do you resell credits?', a: "No. We don't resell credits or tokens." },
    {
      q: 'How is my data protected in the benchmark?',
      a: 'Contributing is opt-in. We remove your company name before your terms are stored, group them by provider and commit band, and never show a band with fewer than 3 companies. You can withdraw your contribution at any time.',
    },
    {
      q: 'Do you see my code?',
      a: 'No. The teardown uses billing exports, which contain no code. For coding agents, recently merged PRs are replayed on your machine, per model and effort level, and only scores, token counts and timings leave it.',
    },
    {
      q: 'Do I have to share prompts for the model map?',
      a: "No. You can run the task set in your own environment, and only scores, token counts and timings leave it. Sharing tasks with us is optional. It lets us read failures, tune the grading with you and explain why a model fell short, not just that it did.",
    },
    {
      q: 'What if there are no savings?',
      a: "Then the teardown says so, and you have a dated record that your setup is sound. It costs nothing. For negotiation, the fee is a share of first-year savings, so no savings means no fee.",
    },
    {
      q: 'Which providers do you cover?',
      a: 'OpenAI, Anthropic, Google (Gemini API and Vertex AI), AWS Bedrock, Azure, open-model hosts such as Together AI and Fireworks, and coding-agent seats including Claude Code, Codex and Cursor.',
    },
    {
      q: 'What do I need to send?',
      a: 'The last 3 full months of usage and cost exports from each provider, your seat counts and plans for coding agents, and your order form if you have a commit. After you request a teardown, we send links to each provider\'s own export instructions.',
    },
  ],
};

export const getStarted = {
  label: 'Get started',
  heading: 'Get a free teardown.',
  body: 'Tell us about your setup. We reply within 1 business day with export instructions for your providers. Your report arrives 48 hours after we receive the files.',
  call: { lead: 'Prefer to talk first?', label: 'Book a call' },
  emailLead: 'Or email',
};

export const form = {
  fields: {
    name: { label: 'Name', autocomplete: 'name' },
    email: { label: 'Work email', autocomplete: 'email' },
    company: { label: 'Company', autocomplete: 'organization' },
    providers: {
      legend: 'Providers you use',
      hint: 'Select all that apply.',
      error: 'Select at least one provider.',
      options: [
        { value: 'openai', label: 'OpenAI' },
        { value: 'anthropic', label: 'Anthropic' },
        { value: 'google', label: 'Google' },
        { value: 'bedrock', label: 'AWS Bedrock' },
        { value: 'azure', label: 'Azure' },
        { value: 'open-model-hosts', label: 'Open-model hosts' },
        { value: 'coding-agents', label: 'Coding-agent seats' },
      ],
    },
    spend: {
      legend: 'Monthly AI spend',
      error: 'Select a spend band.',
      options: ['Under $5K', '$5K to $25K', '$25K to $100K', '$100K+'],
    },
    renewal: { label: 'Next renewal or commit date', optional: 'optional', placeholder: 'e.g. Mar 2027' },
    notes: { label: 'Anything else', optional: 'optional', placeholder: 'Main workloads, current contracts, what prompted this.' },
  },
  required: 'Required',
  submit: 'Request teardown',
  sending: 'Sending',
  fineprint: 'We use this only to reply to you. No mailing list.',
  error: "That didn't go through. Email {email} instead and we'll take it from there.",
  notConfigured: "The form isn't connected yet. Email {email} and we'll take it from there.",
};

export const confirmation = {
  heading: 'Request received.',
  intro: "Thanks, {name}. Here's what happens next.",
  steps: [
    'Joe replies from {email} within 1 business day.',
    "Export the last 3 full months of usage and cost data from each provider you use. Each provider's own instructions are linked below.",
    'Send the files by reply. You can delete key names, project names or user emails first.',
    'Your teardown arrives within 48 hours of us receiving them.',
  ],
  linksHeading: 'Export instructions',
  linksNote: 'Providers you selected are listed first.',
  roleNote: "Most of these need an admin, owner or billing role. If you don't have one, forward this page to whoever does.",
  checked: 'Links checked Oct 31, 2026.',
};

// Official export docs, verified Oct 31, 2026. Keys match form provider values.
export const exportLinks: Record<string, { name: string; how: string; links: { label: string; href: string }[] }> = {
  openai: {
    name: 'OpenAI',
    how: 'Usage page, Export, choose Cost data, Download (CSV).',
    links: [{ label: 'OpenAI Help Center', href: 'https://help.openai.com/en/articles/20001072-exporting-monthly-usage-details-from-the-api-usage-dashboard' }],
  },
  anthropic: {
    name: 'Anthropic',
    how: 'Console Usage and Cost pages, export button (CSV).',
    links: [{ label: 'Claude Help Center', href: 'https://support.claude.com/en/articles/9534590-cost-and-usage-reporting-in-the-claude-console' }],
  },
  google: {
    name: 'Google',
    how: 'Gemini API usage lives in Cloud Billing. Use Reports, filter to the Gemini API or Vertex AI service, Download CSV.',
    links: [
      { label: 'Gemini API billing', href: 'https://ai.google.dev/gemini-api/docs/billing' },
      { label: 'Cloud Billing Reports', href: 'https://docs.cloud.google.com/billing/docs/how-to/reports' },
    ],
  },
  bedrock: {
    name: 'AWS Bedrock',
    how: 'Cost Explorer, filter to Amazon Bedrock, Download CSV.',
    links: [{ label: 'AWS docs', href: 'https://docs.aws.amazon.com/cost-management/latest/userguide/ce-download-csv.html' }],
  },
  azure: {
    name: 'Azure',
    how: 'Cost Management, download usage and charges (CSV).',
    links: [
      { label: 'Microsoft Learn', href: 'https://learn.microsoft.com/en-us/azure/cost-management-billing/understand/download-azure-daily-usage' },
      { label: 'Foundry cost guide', href: 'https://learn.microsoft.com/en-us/azure/foundry/concepts/manage-costs' },
    ],
  },
  'open-model-hosts': {
    name: 'Open-model hosts',
    how: 'For hosts without an export, a screenshot of the usage page and your last invoice is enough.',
    links: [
      { label: 'Together AI cost analytics', href: 'https://docs.together.ai/docs/billing-cost-analytics' },
      { label: 'Fireworks usage and costs', href: 'https://docs.fireworks.ai/accounts/exporting-usage-and-costs' },
      { label: 'OpenRouter activity export', href: 'https://openrouter.ai/docs/cookbook/administration/activity-export' },
    ],
  },
  'coding-agents': {
    name: 'Coding-agent seats',
    how: 'On plans without an export, send your plan name and seat count.',
    links: [
      { label: 'Claude Team and Enterprise spend report', href: 'https://support.claude.com/en/articles/12883420-view-usage-analytics-for-team-and-enterprise-plans' },
      { label: 'Claude Code analytics', href: 'https://code.claude.com/docs/en/analytics' },
      { label: 'Cursor analytics', href: 'https://cursor.com/docs/account/teams/analytics' },
      { label: 'ChatGPT Enterprise workspace analytics (Codex)', href: 'https://help.openai.com/en/articles/10875114-workspace-analytics-for-chatgpt-enterprise-and-edu' },
    ],
  },
};

export const footer = {
  tagline: 'AI bill teardowns and pricing benchmarks for startups.',
  links: [
    { label: 'How it works', href: '/#how-it-works' },
    { label: 'Sample report', href: '/sample' },
    { label: 'Pricing', href: '/#pricing' },
    { label: 'FAQ', href: '/#faq' },
    { label: 'Privacy', href: '/privacy' },
    { label: 'Terms', href: '/terms' },
    { label: 'Security', href: '/.well-known/security.txt' },
  ],
  updated: 'Updated',
  disclaimer: 'ModelPar is independent and not affiliated with any AI provider. Product names belong to their owners.',
};

export const notFound = {
  code: '404',
  heading: "This page isn't on the bill.",
  body: "The page you asked for doesn't exist or has moved.",
  home: 'Go to the homepage',
  sample: 'See the sample report',
};

// ---------------------------------------------------------------------------
// Sample report. {tokens} are filled from src/lib/sample.ts.
// ---------------------------------------------------------------------------
export const sample = {
  banner: {
    title: 'Sample report. All numbers are illustrative.',
    body: 'List prices are real as of {pricesCheckedOn}. Company, usage and findings are invented.',
  },
  actions: { cta: 'Get a free teardown', print: 'Print or save as PDF' },
  header: {
    kicker: 'AI bill teardown',
    sub: '{engineers} engineers · {descriptor}',
    rows: [
      ['Version', '{version}, prepared for {company}'],
      ['Date', '{reportDate}'],
      ['Billing period', '{period}'],
      [
        'Sources',
        'Anthropic Console cost export · OpenAI usage export (cost data) · Google Cloud Billing report · AWS Cost Explorer (Bedrock) · Together AI cost analytics · Claude Code analytics · Cursor team analytics',
      ],
      ['Prepared by', 'ModelPar, {email}'],
    ],
  },
  summary: {
    heading: 'Summary',
    rows: [
      ['October spend', '{total}', '({annual} a year at this rate)'],
      ['Savings with no model change', '{noModelChange} a month', '({noModelChangePct})'],
      ['More if one model swap passes testing', '{modelSwap} a month', ''],
      ['Coding-agent seats', '{seatSavings} a month', 'by moving {seatsMoved} engineers from API billing to Team seats'],
      ['Billing hygiene', '{hygieneSummary}', ''],
    ],
    note: "Two workloads are {top2Share} of spend: the support agent ({top1Share}) and nightly contract extraction ({top2ndShare}). Both have a fix that doesn't change the model.",
  },
  spend: {
    heading: '1. Monthly spend by provider and model',
    chartTitle: 'October spend by model',
    columns: ['Workload', 'Provider', 'Model', 'October', 'Share'],
    totalLabel: 'Total',
    byProviderLabel: 'By provider',
  },
  effective: {
    heading: '2. Effective vs list price, per 1M tokens',
    lead: 'Effective price is billed cost divided by tokens. Input is blended across uncached input, cache reads and cache writes.',
    columns: ['Model', 'Provider, workload', 'List in / out', 'Effective in / out', 'What explains the gap'],
    note: 'No account has a negotiated discount or commit. Anthropic spend, including Bedrock, runs at {anthropicAnnual} a year, under the $250K threshold for a negotiated process. Comps shows what teams in your band get once you contribute your terms.',
  },
  savings: {
    heading: '3. Three savings opportunities',
    columns: ['#', 'Opportunity', 'Now', 'After', 'Monthly savings', 'Model change?', 'Effort'],
    yes: 'Yes, test first',
    no: 'No',
    details: [
      'Support agent caching. The system prompt starts with the current timestamp and the customer\'s plan name, so the 11K-token prefix of instructions and 14 tool definitions changes on every request and rarely matches the cache. Move both fields below the cache breakpoint. Effective input price drops from {supportEffNow} to about {supportEffAfter} per 1M tokens.',
      'Batch for extraction. The job runs from 1am to 5am and nobody reads its output until morning. The Batch API costs 50% less and guarantees completion within 24 hours rather than 4, so the only tradeoff is that a slow batch could land later in the day. Same model, same output.',
      'Haiku for triage. Triage picks one of 23 labels and a priority. claude-haiku-5-5 costs {haikuList} per 1M tokens against {sonnetList}. Check label accuracy and escalation recall on 50 labeled tickets before switching.',
    ],
  },
  seats: {
    heading: '4. Seat vs API: coding agents',
    lead: 'All 5 engineers use Claude Code on a Console API key, billed at API rates (mostly claude-opus-5-5).',
    columns: ['Engineer', 'Oct API bill', 'Active days', 'Best option', 'Option cost', 'Difference', 'Fit'],
    totalLabel: 'Total',
    note: "Seat prices are Claude Team monthly rates ({claudePremiumAnnual} and {claudeStandardAnnual} a seat billed annually). Anthropic doesn't publish plan limits as token counts, so fit is estimated from active days, peak weeks and session length. Trial seats for A and B for 2 weeks before committing.",
    cursorHeading: 'Cursor',
    cursor:
      "{cursorSeats} Teams Premium seats ({cursorSeatPrice} each) include Cursor's own models only. Claude usage inside Cursor bills at API list price, {cursorApi} in October, plus Cursor's Token Rate of {cursorTokenRate} per 1M tokens, another {cursorTokenRateCost}. The rate applies to cached tokens too, and {cursorCachedShare} of those {cursorTokensM}M tokens were cache reads, so it costs {cursorRateRatio} times the {cursorCacheRead} cache-read price itself. Engineers on Claude Team seats can run that work in Claude Code instead.",
  },
  routing: {
    heading: '5. Routing card',
    columns: ['Task type', 'Now', 'Recommended', 'Cost per task', 'Basis'],
    volume: 'in October',
    seat: 'Seat',
    noChange: 'no change',
    note: '"To test" means the recommendation comes from billing data and published prices only. Step 3, the model and effort map, checks it on your own tasks before you switch.',
  },
  hygiene: {
    heading: '6. Billing hygiene',
    columns: ['Check', 'Result', 'Detail'],
    labels: { pass: 'Pass', fail: 'Fail', warn: 'Warning' },
  },
  models: {
    heading: '7. Models worth testing',
    columns: ['Model', 'List in / out per 1M', 'For', 'Why', 'What to check'],
    rows: [
      {
        price: 'haiku',
        for: 'Ticket triage',
        why: "{haikuRatio} of claude-sonnet-5-5's price",
        check: 'Label accuracy and escalation recall on 50 labeled tickets',
      },
      {
        price: 'flashLite31',
        for: 'Call summaries',
        why: 'gemini-3.8-flash rises to {flashNext} on {flashNextDate}. Without a change, this workload goes from {callsNow} to {callsNext} a month.',
        check: 'Action-item recall on 30 calls. Also try gemini-3.5-flash-lite.',
      },
      {
        price: 'terra',
        for: 'Contract extraction',
        why: 'Half the price of gpt-6.1-sol. With Batch, extraction would cost {extractTerraBatch} a month. Released Oct 26, 2026.',
        check: 'Field-level accuracy on 30 contracts',
        batch: true,
      },
      {
        price: 'gptoss',
        for: 'Query rewriting',
        why: 'Half the input price of DeepSeek-V4.1-Flash. Served quantized (MXFP4), so it belongs in the nightly canary.',
        check: 'Click-through on rewritten queries',
      },
      {
        price: 'sonnet',
        label: 'claude-sonnet-5-5 at medium effort',
        for: 'Coding: tests and small fixes',
        why: 'Opus at xhigh on every task is the most expensive setting',
        check: 'Pass rate on 10 recently merged PRs',
      },
    ],
  },
  next: {
    heading: '8. Next steps',
    items: [
      'This week: move the timestamp and plan name below the cache breakpoint in the support agent. About {supportSave} a month.',
      'This week: switch nightly extraction to the Batch API. About {extractSave} a month.',
      'This week: pin the call-summary model version, add a limit to `extraction-backfill`, move evals to their own key, and remove 3 idle Cursor seats.',
      'Before {flashNextDate}: test gemini-3.1-flash-lite on call summaries.',
      'Next 2 weeks: trial Team Premium seats for engineers A and B, keeping the API key as overflow.',
      'Optional: a model and effort map (step 3) for triage, extraction and coding agents.',
    ],
  },
  methodology: {
    heading: 'Methodology',
    body: 'List prices come from each provider\'s public pricing page, checked {pricesCheckedOn}. Effective price is billed cost divided by tokens, including cache reads and writes, batch discounts and regional surcharges, before credits. Savings assume October volumes and current list prices; they are estimates, not guarantees. Recommendations marked "to test" are not yet checked on your tasks. Plan limits are not published as token counts, so seat fit is an estimate.',
    sources: 'Price sources',
  },
  footer: '{company} · AI bill teardown · {version} · {reportDate} · Confidential',
  confidential: 'Confidential',
};

// ---------------------------------------------------------------------------
// Legal pages. Plain language. Must be reviewed by counsel before launch.
// ---------------------------------------------------------------------------
export const legal = {
  banner: '[TO BE REVIEWED BY COUNSEL]',
  bannerNote: 'This is a plain-language draft and has not been reviewed by a lawyer yet.',
  updated: 'Last updated',
  privacy: {
    heading: 'Privacy',
    intro: '{brand} is operated by {legalEntity}, {city}. This page explains what we collect, why, and how to have it deleted.',
    sections: [
      {
        h: 'What we collect',
        p: [
          'From the teardown form: your name, work email, company, the providers you use, your spend band, your renewal date if you give one, and anything you write in the notes field.',
          'From you, if you send them: usage and cost exports, seat counts and plans, and order forms. Exports contain token counts and dollar amounts. Some include API key names, project names or user emails; you can remove those before sending.',
          'For Comps, only if you opt in: your contract terms (provider, discount, commit, term, credits, offer date).',
          'For the model map, only if you choose to share them: production tasks and grading criteria. If you run tasks in your own environment or replay PRs on your machine, we receive only scores, token counts and timings.',
          'Site analytics: we use Plausible, which counts page views without cookies and without collecting personal data. We do not use advertising trackers.',
        ],
      },
      {
        h: 'What we never ask for',
        p: ['API keys, console access, source code, or your customers\' data. The teardown does not need any of these.'],
      },
      {
        h: 'How we use it',
        p: [
          'To reply to you, prepare your teardown and any later work you ask for, and to build the anonymized Comps benchmark from terms you chose to contribute. We do not sell your data or use it for advertising.',
        ],
      },
      {
        h: 'Comps and anonymization',
        p: [
          'Contributed terms are stored without your company name and shown only in bands. A band is never shown with fewer than 3 companies. You can withdraw your contribution at any time.',
        ],
      },
      {
        h: 'Retention and deletion',
        p: [
          'Files you send are deleted when you ask, and automatically 90 days after we receive them. Email {email} to request deletion of anything we hold about you.',
        ],
      },
      {
        h: 'Service providers',
        p: [
          'We use a small number of providers to run this site and our work: [FORM_PROVIDER] to receive form submissions, [EMAIL_PROVIDER] for email, [FILE_STORAGE] for files you send, [HOSTING_PROVIDER] to host the site, and Plausible for analytics.',
        ],
      },
      {
        h: 'Contact',
        p: ['Questions about privacy: {email}.'],
      },
    ],
  },
  terms: {
    heading: 'Terms',
    intro: 'These terms cover your use of the {brand} website and services, provided by {legalEntity}, {city}.',
    sections: [
      {
        h: 'The services',
        p: [
          'The teardown is free. Comps is free for teams that contribute their terms. The model and effort map and the negotiation service are paid and are covered by a separate written agreement before work starts.',
        ],
      },
      {
        h: 'Estimates, not guarantees',
        p: [
          'Teardowns, routing cards and benchmarks are estimates based on the data you provide and on providers\' published prices at the time. Prices and models change. You decide what to change in your systems and contracts.',
        ],
      },
      {
        h: 'Your data',
        p: [
          'You keep ownership of everything you send us. You confirm you are allowed to share it. We handle it as described in our Privacy page. A mutual NDA is available on request.',
        ],
      },
      {
        h: 'Independence',
        p: [
          '{brand} is independent and not affiliated with any AI provider. Product and model names belong to their owners. We do not resell credits.',
        ],
      },
      {
        h: 'Negotiation fees',
        p: [
          'For negotiation, the fee is [20 to 30]% of first-year savings, measured against your current effective rates at the same usage. If there are no savings, there is no fee. Exact terms are set in the written agreement.',
        ],
      },
      {
        h: 'Liability',
        p: [
          '[LIABILITY TERMS: to be drafted by counsel.]',
        ],
      },
      {
        h: 'Changes and contact',
        p: ['We may update these terms and will change the date above when we do. Questions: {email}.'],
      },
    ],
  },
  lastUpdated: '2026-10-31',
};

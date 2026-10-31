// Numbers behind the /sample report.
//
// List prices are real and must match each provider's pricing page.
// `npm run check:prices` verifies them and a weekly GitHub Action runs it.
// When a price changes, edit it here: every total, share and savings figure
// on /sample and the homepage is recomputed at build time.
//
// Usage volumes are invented. Token volumes are in millions (M) of tokens.

export const sampleMeta = {
  company: 'Example Co.',
  engineers: 14,
  descriptor: 'B2B support software',
  version: 'v1',
  reportDate: '2026-11-03',
  periodStart: '2026-10-01',
  periodEnd: '2026-10-31',
  // Updated by the weekly price check when every price still matches.
  pricesCheckedOn: '2026-10-31',
};

// $ per 1M tokens. cacheWrite is the default (shortest) cache-write rate.
export type Price = {
  id: string;
  provider: string;
  in: number;
  out: number;
  cacheRead?: number;
  cacheWrite?: number;
  page: string;
  // Optional scheduled change, shown in the report.
  next?: { in: number; out: number; from: string };
  note?: string;
};

export const prices = {
  sonnet: { id: 'claude-sonnet-5-5', provider: 'Anthropic', in: 2, out: 10, cacheRead: 0.1, cacheWrite: 2.5, page: 'https://claude.com/pricing' },
  opus: { id: 'claude-opus-5-5', provider: 'Anthropic', in: 4, out: 20, cacheRead: 0.2, cacheWrite: 5, page: 'https://claude.com/pricing' },
  haiku: { id: 'claude-haiku-5-5', provider: 'Anthropic', in: 0.1, out: 0.5, cacheRead: 0.01, cacheWrite: 0.125, page: 'https://claude.com/pricing', note: 'Prompts up to 100K tokens' },
  sol: { id: 'gpt-6.1-sol', provider: 'OpenAI', in: 2, out: 10, cacheRead: 0.1, cacheWrite: 2.5, page: 'https://developers.openai.com/api/docs/pricing' },
  terra: { id: 'gpt-6.1-terra', provider: 'OpenAI', in: 1, out: 5, cacheRead: 0.05, cacheWrite: 1.25, page: 'https://developers.openai.com/api/docs/pricing' },
  embed: { id: 'text-embedding-3-small', provider: 'OpenAI', in: 0.02, out: 0, page: 'https://developers.openai.com/api/docs/pricing' },
  flash: { id: 'gemini-3.8-flash', provider: 'Google', in: 0.75, out: 3.75, cacheRead: 0.075, page: 'https://ai.google.dev/gemini-api/docs/pricing', next: { in: 1.5, out: 7.5, from: '2027-01-01' } },
  flashLite31: { id: 'gemini-3.1-flash-lite', provider: 'Google', in: 0.25, out: 1.5, cacheRead: 0.025, page: 'https://ai.google.dev/gemini-api/docs/pricing' },
  flashLite35: { id: 'gemini-3.5-flash-lite', provider: 'Google', in: 0.3, out: 2.5, cacheRead: 0.03, page: 'https://ai.google.dev/gemini-api/docs/pricing' },
  deepseek: { id: 'DeepSeek-V4.1-Flash', provider: 'Together AI', in: 0.3, out: 1.2, cacheRead: 0.006, page: 'https://docs.together.ai/docs/serverless/models' },
  gptoss: { id: 'openai/gpt-oss-120b', provider: 'Together AI', in: 0.15, out: 0.6, page: 'https://docs.together.ai/docs/serverless/models', note: 'Served as MXFP4' },
} satisfies Record<string, Price>;

export const tiers = {
  // Batch API discount on OpenAI and Anthropic.
  batchFactor: 0.5,
  // AWS Bedrock In-Region and Geo endpoints cost 10% over Global list price.
  bedrockInRegionFactor: 1.1,
};

// Per seat per month, monthly billing unless noted.
export const seats = {
  claudeTeamPremium: 125,
  claudeTeamPremiumAnnual: 100,
  claudeTeamStandard: 25,
  claudeTeamStandardAnnual: 20,
  cursorTeamsPremium: 30,
  // Cursor Teams: added to eligible third-party model requests, including cached tokens.
  cursorTokenRate: 0.25,
  seatPages: {
    claude: 'https://claude.com/pricing',
    cursor: 'https://cursor.com/docs/account/teams/pricing',
  },
};

// Token volumes for October (M tokens): u = uncached input, r = cache reads,
// w = cache writes, o = output. tasks = units of work in the month.
export type Tokens = { u: number; r?: number; w?: number; o: number };

export const workloads = {
  support: { label: 'Support agent', price: 'sonnet', provider: 'Anthropic API', t: { u: 2600, r: 1450, w: 150, o: 120 }, tasks: 300_000, taskUnit: 'agent turns' },
  extract: { label: 'Contract extraction (nightly)', price: 'sol', provider: 'OpenAI', t: { u: 1900, r: 500, w: 20, o: 260 }, tasks: 210_000, taskUnit: 'documents' },
  calls: { label: 'Call summaries', price: 'flash', provider: 'Google Gemini API', t: { u: 2800, o: 190 }, tasks: 95_000, taskUnit: 'calls' },
  claudeCode: { label: 'Claude Code, API key (5 engineers)', price: 'opus', provider: 'Anthropic API', t: { u: 120, r: 3900, w: 150, o: 30 }, tasks: 0, taskUnit: '' },
  triage: { label: 'Ticket triage', price: 'sonnet', provider: 'Anthropic API', t: { u: 960, o: 25.6 }, tasks: 320_000, taskUnit: 'tickets' },
  euSupport: { label: 'Support agent, EU customers', price: 'sonnet', provider: 'AWS Bedrock', regionFactor: 1.1, t: { u: 330, r: 1180, w: 40, o: 52 }, tasks: 0, taskUnit: '' },
  evals: { label: 'Evals and staging', price: 'opus', provider: 'Anthropic API', t: { u: 205, r: 60, w: 12, o: 13 }, tasks: 0, taskUnit: '' },
  escalations: { label: 'Escalation drafts', price: 'opus', provider: 'Anthropic API', t: { u: 170, r: 28, o: 13.5 }, tasks: 9_000, taskUnit: 'drafts' },
  rewrite: { label: 'Search query rewriting', price: 'deepseek', provider: 'Together AI', t: { u: 1400, r: 600, o: 160 }, tasks: 2_100_000, taskUnit: 'queries' },
  cursorModels: { label: 'claude-sonnet-5-5 inside Cursor', price: 'sonnet', provider: 'Cursor', t: { u: 48, r: 1050, w: 20, o: 9 }, tasks: 0, taskUnit: '', cursorTokenRate: true },
  embeddings: { label: 'Embeddings', price: 'embed', provider: 'OpenAI', t: { u: 3100, o: 0 }, tasks: 0, taskUnit: '' },
} as const;

export const cursorSeatCount = 9;
export const cursorIdleSeats = 3;

// What the fixes would look like (M tokens).
export const scenarios = {
  supportCachingFixed: { u: 640, r: 3360, w: 200, o: 120 },
  // Retry loop on Oct 18 to 19, part of triage volume above.
  triageRetryInputM: 198,
  triageRetryOutputM: 1.6,
};

// Claude Code on API billing, split across 5 engineers.
export const engineers = [
  { name: 'A', share: 0.5, activeDays: 21, option: 'claudeTeamPremium', fit: 'Borderline. Heaviest weeks may exceed Premium limits. Keep the API key as overflow.' },
  { name: 'B', share: 0.3, activeDays: 20, option: 'claudeTeamPremium', fit: 'Likely fits' },
  { name: 'C', share: 0.13, activeDays: 17, option: 'claudeTeamPremium', fit: 'Likely fits' },
  { name: 'D', share: 0.05, activeDays: 9, option: 'claudeTeamStandard', fit: 'Likely fits' },
  { name: 'E', share: 0.02, activeDays: 4, option: 'api', fit: 'Below the price of any seat' },
] as const;

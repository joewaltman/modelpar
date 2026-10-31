// Computes every figure in the sample report from src/content/sample-data.ts.
import {
  sampleMeta,
  prices,
  tiers,
  seats,
  workloads,
  scenarios,
  engineers,
  cursorSeatCount,
  cursorIdleSeats,
  type Price,
  type Tokens,
} from '../content/sample-data';

type PriceKey = keyof typeof prices;
type WorkloadKey = keyof typeof workloads;

// ---------- formatting ----------
export const usd = (n: number) => '$' + Math.round(n).toLocaleString('en-US');
export const usd2 = (n: number) => '$' + n.toFixed(2);
export const perM = (n: number) => (n < 0.1 && n > 0 ? '$' + n.toFixed(3) : '$' + n.toFixed(2));
export const perTask = (n: number) => (n < 0.001 ? '$' + n.toFixed(4) : '$' + n.toFixed(3));
export const pct = (n: number, digits = 1) => (n * 100).toFixed(digits) + '%';
export const int = (n: number) => Math.round(n).toLocaleString('en-US');
export const compact = (n: number) =>
  n >= 1_000_000 ? +(n / 1_000_000).toFixed(1) + 'M' : n >= 1_000 ? Math.round(n / 1_000) + 'K' : String(n);

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
export const date = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number);
  return `${MONTHS[m - 1]} ${d}, ${y}`;
};

// ---------- cost math ----------
const P = (k: PriceKey): Price => prices[k];

export function inputCost(p: Price, t: Tokens) {
  return t.u * p.in + (t.r ?? 0) * (p.cacheRead ?? p.in) + (t.w ?? 0) * (p.cacheWrite ?? p.in);
}
export function cost(p: Price, t: Tokens, factor = 1) {
  return factor * (inputCost(p, t) + t.o * p.out);
}
export const inputTokens = (t: Tokens) => t.u + (t.r ?? 0) + (t.w ?? 0);
export const allTokens = (t: Tokens) => inputTokens(t) + t.o;
export const effIn = (p: Price, t: Tokens, factor = 1) => (factor * inputCost(p, t)) / inputTokens(t);
export const cacheShare = (t: Tokens) => (t.r ?? 0) / inputTokens(t);

function workloadCost(k: WorkloadKey) {
  const w = workloads[k] as (typeof workloads)[WorkloadKey] & { regionFactor?: number; cursorTokenRate?: boolean };
  const p = P(w.price as PriceKey);
  const api = cost(p, w.t, w.regionFactor ?? 1);
  const tokenRate = w.cursorTokenRate ? allTokens(w.t) * seats.cursorTokenRate : 0;
  return { api, tokenRate, total: api + tokenRate };
}

const wc = Object.fromEntries(
  (Object.keys(workloads) as WorkloadKey[]).map((k) => [k, workloadCost(k)]),
) as Record<WorkloadKey, ReturnType<typeof workloadCost>>;

const cursorSeatsCost = cursorSeatCount * seats.cursorTeamsPremium;

// ---------- spend table ----------
export type SpendRow = { provider: string; model: string; workload: string; cost: number; share: number };

const rawRows: Omit<SpendRow, 'share'>[] = (Object.keys(workloads) as WorkloadKey[]).map((k) => {
  const w = workloads[k];
  if (k === 'cursorModels') {
    return { provider: 'Cursor', model: P(w.price as PriceKey).id, workload: 'Third-party model usage, incl. Cursor Token Rate', cost: wc[k].total };
  }
  return { provider: w.provider, model: P(w.price as PriceKey).id, workload: w.label, cost: wc[k].total };
});
rawRows.push({ provider: 'Cursor', model: `Teams, ${cursorSeatCount} Premium seats`, workload: 'Coding-agent seats', cost: cursorSeatsCost });

export const total = rawRows.reduce((a, r) => a + r.cost, 0);
export const spendRows: SpendRow[] = rawRows
  .map((r) => ({ ...r, share: r.cost / total }))
  .sort((a, b) => b.cost - a.cost);

const sumBy = (key: (r: SpendRow) => string) => {
  const m = new Map<string, number>();
  for (const r of spendRows) m.set(key(r), (m.get(key(r)) ?? 0) + r.cost);
  return [...m.entries()].map(([name, v]) => ({ name, cost: v, share: v / total })).sort((a, b) => b.cost - a.cost);
};
export const byProvider = sumBy((r) => r.provider);
export const byModel = sumBy((r) => {
  if (r.provider === 'Cursor' && r.workload === 'Coding-agent seats') return 'Cursor seats';
  if (r.provider === 'AWS Bedrock') return `${r.model} (Bedrock)`;
  if (r.provider === 'Cursor') return `${r.model} (in Cursor)`;
  return r.model;
});

// ---------- effective vs list ----------
function blendedIn(keys: WorkloadKey[]) {
  let cost$ = 0;
  let tok = 0;
  for (const k of keys) {
    const w = workloads[k] as (typeof workloads)[WorkloadKey] & { regionFactor?: number };
    cost$ += (w.regionFactor ?? 1) * inputCost(P(w.price as PriceKey), w.t);
    tok += inputTokens(w.t);
  }
  return cost$ / tok;
}

export const effective = [
  { model: P('sonnet').id, where: 'Anthropic API, support agent and triage', list: [P('sonnet').in, P('sonnet').out], eff: [blendedIn(['support', 'triage']), P('sonnet').out], why: `Only ${pct(cacheShare(workloads.support.t), 0)} of support-agent input comes from cache. Triage has no caching.` },
  { model: P('opus').id, where: 'Anthropic API, Claude Code', list: [P('opus').in, P('opus').out], eff: [blendedIn(['claudeCode']), P('opus').out], why: `${pct(cacheShare(workloads.claudeCode.t), 0)} of input is cache reads. Working as intended.` },
  { model: P('opus').id, where: 'Anthropic API, escalations and evals', list: [P('opus').in, P('opus').out], eff: [blendedIn(['escalations', 'evals']), P('opus').out], why: 'Little caching. Low volume, low priority.' },
  { model: P('sonnet').id, where: 'AWS Bedrock, EU In-Region', list: [P('sonnet').in, P('sonnet').out], eff: [blendedIn(['euSupport']), P('sonnet').out * tiers.bedrockInRegionFactor], why: `In-Region endpoint adds ${pct(tiers.bedrockInRegionFactor - 1, 0)}, required for EU data residency. Caching is healthy (${pct(cacheShare(workloads.euSupport.t), 0)}).` },
  { model: P('sol').id, where: 'OpenAI, contract extraction', list: [P('sol').in, P('sol').out], eff: [blendedIn(['extract']), P('sol').out], why: 'Runs on the Standard tier although nobody waits on it. Batch is half price.' },
  { model: P('flash').id, where: 'Google, call summaries', list: [P('flash').in, P('flash').out], eff: [blendedIn(['calls']), P('flash').out], why: `No caching. List price rises to ${usd2(prices.flash.next.in)} / ${usd2(prices.flash.next.out)} on ${date(prices.flash.next.from)}.`, flag: true },
  { model: P('deepseek').id, where: 'Together AI, query rewriting', list: [P('deepseek').in, P('deepseek').out], eff: [blendedIn(['rewrite']), P('deepseek').out], why: 'Cached input on the shared prompt.' },
  { model: P('embed').id, where: 'OpenAI, embeddings', list: [P('embed').in, null], eff: [blendedIn(['embeddings']), null], why: 'At list.' },
];

// ---------- savings ----------
const supportFixed = cost(P('sonnet'), scenarios.supportCachingFixed);
const extractBatch = wc.extract.total * tiers.batchFactor;
const triageHaiku = cost(P('haiku'), workloads.triage.t);

export const savings = [
  { n: 1, title: 'Fix prompt caching on the support agent', now: wc.support.total, after: supportFixed, modelChange: false, effort: '1 to 2 hours' },
  { n: 2, title: 'Move nightly contract extraction to the Batch API', now: wc.extract.total, after: extractBatch, modelChange: false, effort: 'Half a day' },
  { n: 3, title: `Route ticket triage from ${P('sonnet').id} to ${P('haiku').id}`, now: wc.triage.total, after: triageHaiku, modelChange: true, effort: '1 day plus test' },
].map((s) => ({ ...s, save: s.now - s.after }));

export const noModelChangeSavings = savings.filter((s) => !s.modelChange).reduce((a, s) => a + s.save, 0);
export const modelSwapSavings = savings.filter((s) => s.modelChange).reduce((a, s) => a + s.save, 0);

// ---------- seat vs API ----------
const seatPrice = (opt: string) =>
  opt === 'claudeTeamPremium' ? seats.claudeTeamPremium : opt === 'claudeTeamStandard' ? seats.claudeTeamStandard : null;
const seatLabel = (opt: string) =>
  opt === 'claudeTeamPremium' ? 'Team Premium seat' : opt === 'claudeTeamStandard' ? 'Team Standard seat' : 'Stay on API';

export const seatRows = engineers.map((e) => {
  const api = Math.round(wc.claudeCode.total * e.share);
  const optionCost = seatPrice(e.option) ?? api;
  return { name: e.name, api, activeDays: e.activeDays, option: seatLabel(e.option), optionCost, diff: optionCost - api, fit: e.fit };
});
export const seatTotals = {
  api: seatRows.reduce((a, r) => a + r.api, 0),
  option: seatRows.reduce((a, r) => a + r.optionCost, 0),
};
export const seatSavings = seatTotals.api - seatTotals.option;
export const seatsMovedCount = seatRows.filter((r) => r.option !== 'Stay on API').length;

export const cursor = {
  seats: cursorSeatCount,
  seatPrice: seats.cursorTeamsPremium,
  seatsCost: cursorSeatsCost,
  apiCost: wc.cursorModels.api,
  tokenRateCost: wc.cursorModels.tokenRate,
  tokensM: allTokens(workloads.cursorModels.t),
  cachedShare: (workloads.cursorModels.t.r ?? 0) / allTokens(workloads.cursorModels.t),
  tokenRate: seats.cursorTokenRate,
  cacheReadPrice: P('sonnet').cacheRead ?? 0,
  idleSeats: cursorIdleSeats,
  idleCost: cursorIdleSeats * seats.cursorTeamsPremium,
};

// ---------- per task and alternatives ----------
const per = (k: WorkloadKey, c = wc[k].total) => c / workloads[k].tasks;
const callsNext = cost({ ...P('flash'), in: prices.flash.next.in, out: prices.flash.next.out }, workloads.calls.t);
const callsLite31 = cost(P('flashLite31'), workloads.calls.t);
const callsLite35 = cost(P('flashLite35'), workloads.calls.t);
const rewriteOss = cost(P('gptoss'), { u: inputTokens(workloads.rewrite.t), o: workloads.rewrite.t.o });
const extractTerraBatch = cost(P('terra'), workloads.extract.t) * tiers.batchFactor;

export const routing = [
  { task: 'Support reply (one agent turn)', volume: workloads.support.tasks, now: `${P('sonnet').id}, high`, model: P('sonnet').id, effort: 'high (test medium)', costNow: per('support'), costNext: supportFixed / workloads.support.tasks, headroom: null, basis: 'Caching fix only' },
  { task: 'Escalation draft', volume: workloads.escalations.tasks, now: `${P('opus').id}, high`, model: P('opus').id, effort: 'high', costNow: per('escalations'), costNext: null, headroom: null, basis: 'Hardest 3% of tickets' },
  { task: 'Ticket triage', volume: workloads.triage.tasks, now: `${P('sonnet').id}, high`, model: P('haiku').id, effort: 'low', costNow: per('triage'), costNext: triageHaiku / workloads.triage.tasks, headroom: null, basis: 'To test' },
  { task: 'Contract extraction', volume: workloads.extract.tasks, now: `${P('sol').id}, Standard tier`, model: `${P('sol').id}, Batch tier`, effort: 'default', costNow: per('extract'), costNext: extractBatch / workloads.extract.tasks, headroom: null, basis: 'Same model' },
  { task: 'Call summary', volume: workloads.calls.tasks, now: `${P('flash').id} via gemini-flash-latest`, model: `${P('flashLite31').id}, pinned`, effort: 'default', costNow: per('calls'), costNext: callsLite31 / workloads.calls.tasks, headroom: null, basis: `To test before ${date(prices.flash.next.from)}` },
  { task: 'Search query rewrite', volume: workloads.rewrite.tasks, now: P('deepseek').id, model: P('gptoss').id, effort: 'default', costNow: per('rewrite'), costNext: rewriteOss / workloads.rewrite.tasks, headroom: null, basis: 'To test' },
  { task: 'Coding: feature work', volume: null, now: `${P('opus').id}, xhigh, API key`, model: `${P('opus').id} on Team Premium`, effort: 'high', costNow: null, costNext: null, headroom: 'Est. fits for 3 of 4 heavy users', basis: 'See seat table' },
  { task: 'Coding: tests and small fixes', volume: null, now: `${P('opus').id}, xhigh`, model: P('sonnet').id, effort: 'medium', costNow: null, costNext: null, headroom: 'Frees Premium limits for feature work', basis: 'To test on 10 merged PRs' },
];

export const alternatives = {
  callsNow: wc.calls.total,
  callsNext,
  callsLite31,
  callsLite35,
  rewriteNow: wc.rewrite.total,
  rewriteOss,
  extractTerraBatch,
};

// ---------- hygiene ----------
const retryCost = scenarios.triageRetryInputM * P('sonnet').in + scenarios.triageRetryOutputM * P('sonnet').out;
export const hygiene = [
  { check: 'Spend limit on every production project', result: 'fail', detail: 'OpenAI project `extraction-backfill` has no monthly limit or alert.' },
  { check: 'Production calls pin a model version', result: 'fail', detail: 'The call-summary service calls `gemini-flash-latest`. When the alias moves, quality and price change without a deploy.' },
  { check: 'Credits applying to invoices: Google', result: 'fail', detail: `$15,000 in credits sit on billing account \`example-co-main\`. The Gemini API project bills to \`example-co-ai\`, so October's ${usd(wc.calls.total)} was paid in full.` },
  { check: 'Credits applying to invoices: OpenAI', result: 'pass', detail: '$5,000 credit expiring Dec 31, 2026 applies in full at current usage.' },
  { check: 'Evals and staging on separate keys', result: 'fail', detail: `${usd(wc.evals.total)} of eval runs used the production Anthropic key, sharing its rate limits and blending into production cost.` },
  { check: 'Runaway-loop guard', result: 'warn', detail: `Oct 18 to 19: the triage worker retried a failing batch for 31 hours, ${int(scenarios.triageRetryInputM)}M extra input tokens, ${usd(retryCost)}. Add a retry cap and a daily per-key limit.` },
  { check: 'Idle seats', result: 'fail', detail: `${cursorIdleSeats} of ${cursorSeatCount} Cursor seats had no activity in 30 days (${usd(cursorIdleSeats * seats.cursorTeamsPremium)} a month).` },
  { check: 'Usage alerts', result: 'pass', detail: 'Anthropic and Together alerts at 80% of monthly budget.' },
  { check: 'Data-residency surcharge matches policy', result: 'pass', detail: `Bedrock In-Region (+${pct(tiers.bedrockInRegionFactor - 1, 0)}) is used only for EU customers.` },
] as const;
export const hygieneCounts = {
  fail: hygiene.filter((h) => h.result === 'fail').length,
  warn: hygiene.filter((h) => h.result === 'warn').length,
  pass: hygiene.filter((h) => h.result === 'pass').length,
};

// ---------- headline figures used in copy ----------
const top2 = spendRows.slice(0, 2);
export const figures = {
  company: sampleMeta.company,
  engineers: String(sampleMeta.engineers),
  descriptor: sampleMeta.descriptor,
  version: sampleMeta.version,
  reportDate: date(sampleMeta.reportDate),
  period: `${date(sampleMeta.periodStart).replace(/, \d{4}$/, '')} to ${date(sampleMeta.periodEnd)}`,
  pricesCheckedOn: date(sampleMeta.pricesCheckedOn),
  total: usd(total),
  annual: '$' + Math.round((total * 12) / 1000) + 'K',
  noModelChange: usd(noModelChangeSavings),
  noModelChangePct: pct(noModelChangeSavings / total, 0),
  modelSwap: usd(modelSwapSavings),
  seatSavings: usd(seatSavings),
  seatsMoved: String(seatsMovedCount),
  hygieneSummary: `${hygieneCounts.fail} fail · ${hygieneCounts.warn} warning · ${hygieneCounts.pass} pass`,
  top2Share: pct(top2[0].share + top2[1].share, 0),
  top1Share: pct(top2[0].share, 0),
  top2ndShare: pct(top2[1].share, 0),
  supportCache: pct(cacheShare(workloads.support.t), 0),
  supportEffNow: usd2(effIn(P('sonnet'), workloads.support.t)),
  supportEffAfter: usd2(effIn(P('sonnet'), scenarios.supportCachingFixed)),
  extractEffNow: usd2(effIn(P('sol'), workloads.extract.t)),
  extractEffAfter: usd2(effIn(P('sol'), workloads.extract.t) * tiers.batchFactor),
  callsList: usd2(P('flash').in),
  callsAlt: usd2(P('flashLite31').in),
  sonnetList: `${usd2(P('sonnet').in)} / ${usd2(P('sonnet').out)}`,
  haikuList: `${usd2(P('haiku').in)} / ${usd2(P('haiku').out)}`,
  haikuRatio: `1/${Math.round(P('sonnet').in / P('haiku').in)}th`,
  anthropicAnnual: '$' + Math.round(((byProvider.find((p) => p.name === 'Anthropic API')?.cost ?? 0) + (byProvider.find((p) => p.name === 'AWS Bedrock')?.cost ?? 0)) * 12 / 1000) + 'K',
  flashNextDate: date(prices.flash.next.from),
  flashNext: `${usd2(prices.flash.next.in)} / ${usd2(prices.flash.next.out)}`,
  callsNow: usd(alternatives.callsNow),
  callsNext: usd(alternatives.callsNext),
  extractTerraBatch: usd(alternatives.extractTerraBatch),
  cursorSeats: String(cursor.seats),
  cursorSeatPrice: usd(cursor.seatPrice),
  cursorApi: usd(cursor.apiCost),
  cursorTokenRateCost: usd(cursor.tokenRateCost),
  cursorTokenRate: usd2(cursor.tokenRate),
  cursorCacheRead: usd2(cursor.cacheReadPrice),
  cursorRateRatio: String(+(cursor.tokenRate / cursor.cacheReadPrice).toFixed(1)),
  cursorCachedShare: pct(cursor.cachedShare, 0),
  cursorTokensM: int(cursor.tokensM),
  claudePremium: usd(seats.claudeTeamPremium),
  claudePremiumAnnual: usd(seats.claudeTeamPremiumAnnual),
  claudeStandardAnnual: usd(seats.claudeTeamStandardAnnual),
  supportSave: usd(savings[0].save),
  extractSave: usd(savings[1].save),
  bedrockSurcharge: pct(tiers.bedrockInRegionFactor - 1, 0),
};

// Replace {key} tokens in copy with computed figures.
export function fill(text: string, vars: Record<string, string> = figures) {
  return text.replace(/\{(\w+)\}/g, (m, k) => (k in vars ? vars[k] : m));
}

export { sampleMeta, prices, seats, workloads, tiers };

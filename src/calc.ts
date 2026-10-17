import type { PlannerResult, PlannerState, RenditeLevel, YearDataPoint } from './types';

export const START_YEAR = new Date().getFullYear();
export const RETIRE_MIN = 40;
export const RETIRE_MAX = 65;
export const BTC_SUPPLY = 21_000_000;
export const SAVINGS_BUDGET = 200;

/** Effektive Steuer auf ETF-Gewinne: 25 % Abgeltungsteuer + 5,5 % Soli, 30 % Teilfreistellung (Aktien-ETF), ohne Kirchensteuer. */
export const ETF_TAX = 0.25 * 1.055 * 0.7;

export const DEFAULT_STATE: PlannerState = {
  startAge: 29,
  retireAge: 60,
  lifeExp: 85,
  btcAmount: 0,
  btcPrice: 62000,
  btcSave: 0,
  btcRate: 0.15,
  btcDecay: false,
  btcRateEnd: 0.08,
  etfSave: 100,
  etfRate: 0.07,
  inflRate: 0.02,
  rentTarget: 3000,
  withdrawRate: 0.04,
  retireReturn: 0.04,
  crashOn: false,
  crashPct: 0.75,
  crashYearsBefore: 1,
  glideOn: false,
  glideYears: 10,
  glidePct: 0.8,
  taxOn: false,
  showReal: false,
};

/** Langfrist-Annahmen nach VanEck Capital Market Assumptions (Jan. 2026, Horizont bis 2050). */
export const SCENARIOS = [
  { id: 'bear', label: 'Bär', rate: 0.02, hint: '2 % p.a.' },
  { id: 'base', label: 'Basis', rate: 0.15, hint: '15 % p.a.' },
  { id: 'bull', label: 'Bulle', rate: 0.29, hint: '29 % p.a.' },
] as const;

export const RENDITE_LEVELS: RenditeLevel[] = [
  {
    max: 8,
    tone: 'green',
    label: 'Sehr konservativ',
    context: 'Nahe am Bären-Szenario (VanEck: 2 % p.a. bis 2050) bzw. auf Aktienniveau.',
    note: 'Wer so plant, wird von der Realität eher positiv überrascht als enttäuscht.',
  },
  {
    max: 15,
    tone: 'blue',
    label: 'Realistisch (Empfehlung)',
    context: 'Entspricht dem Basis-Szenario für sehr lange Horizonte (VanEck: ~15 % p.a. bis 2050).',
    note: 'Solide Planungsgrundlage: unterstellt weiteres Wachstum, aber keine Wiederholung der Vergangenheit.',
  },
  {
    max: 25,
    tone: 'amber',
    label: 'Optimistisch',
    context: 'Über 30 Jahre nur bei anhaltend starker institutioneller und staatlicher Adoption.',
    note: 'Als Hoffnung legitim, als Planungsgrundlage riskant – Lücke einplanen, falls es weniger wird.',
  },
  {
    max: 100,
    tone: 'red',
    label: 'Bullen-Szenario',
    context: 'Entspricht dem Best Case (VanEck-Bulle: 29 % p.a.); historische 80 %+ gelten als nicht fortschreibbar.',
    note: 'Damit zu planen heißt, die Rente auf den günstigsten Fall zu wetten.',
  },
];

export function getRenditeLevel(ratePct: number): RenditeLevel {
  return RENDITE_LEVELS.find((l) => ratePct <= l.max) ?? RENDITE_LEVELS[RENDITE_LEVELS.length - 1];
}

export function savingYears(s: PlannerState): number {
  return Math.max(0, s.retireAge - s.startAge);
}

export function retireMin(s: PlannerState): number {
  return Math.max(RETIRE_MIN, s.startAge + 1);
}

/** BTC-Rendite im Jahr y (0-basiert) – konstant oder linear abnehmend. */
export function btcRateAtYear(s: PlannerState, y: number, years: number): number {
  if (!s.btcDecay || years <= 1) return s.btcRate;
  return s.btcRate + (s.btcRateEnd - s.btcRate) * (y / (years - 1));
}

const monthly = (annual: number) => Math.pow(1 + annual, 1 / 12);

/** Hält abhängige Werte konsistent, wenn sich ein Wert ändert. */
export function applyChange<K extends keyof PlannerState>(prev: PlannerState, key: K, value: PlannerState[K]): PlannerState {
  const next: PlannerState = { ...prev, [key]: value };
  next.startAge = Math.min(RETIRE_MAX - 1, Math.max(16, Math.round(next.startAge)));
  next.retireAge = Math.min(RETIRE_MAX, Math.max(retireMin(next), next.retireAge));
  if (next.lifeExp <= next.retireAge) next.lifeExp = Math.min(100, next.retireAge + 1);
  const years = savingYears(next);
  if (next.crashYearsBefore > years) next.crashYearsBefore = years;
  if (next.glideYears > years) next.glideYears = Math.max(1, years);
  return next;
}

/** Liest gespeicherten Zustand; fehlende oder ungültige Werte fallen auf den Standard zurück. */
export function sanitizeState(raw: unknown): PlannerState {
  const out = { ...DEFAULT_STATE } as Record<string, number | boolean>;
  if (raw && typeof raw === 'object') {
    for (const [key, def] of Object.entries(DEFAULT_STATE)) {
      const v = (raw as Record<string, unknown>)[key];
      if (typeof def === 'number' && typeof v === 'number' && Number.isFinite(v)) out[key] = v;
      if (typeof def === 'boolean' && typeof v === 'boolean') out[key] = v;
    }
  }
  const s = out as unknown as PlannerState;
  return applyChange(s, 'retireAge', s.retireAge);
}

export function calculate(s: PlannerState): PlannerResult {
  const YEARS = savingYears(s);
  const N = YEARS * 12;
  const etfM = monthly(s.etfRate);

  const crashAtMonth = s.crashOn ? Math.max(0, YEARS - s.crashYearsBefore) * 12 : -1;
  const glideMonths = s.glideOn ? Math.min(N, Math.round(s.glideYears * 12)) : 0;
  const glideStart = N - glideMonths;
  const glideSellPerMonth = glideMonths > 0 ? 1 - Math.pow(1 - s.glidePct, 1 / glideMonths) : 0;

  const btcCurrentValue = s.btcAmount * s.btcPrice;
  let btc = btcCurrentValue;
  let etf = 0;
  let etfBasis = 0;
  let holdingOnly = btcCurrentValue;

  // Kapitalbedarf (nominal) zum Rentenbeginn
  const rentTargetNominal = s.rentTarget * Math.pow(1 + s.inflRate, YEARS);
  const neededCapital = (rentTargetNominal * 12) / s.withdrawRate;

  const deflate = (t: number) => (s.showReal ? Math.pow(1 + s.inflRate, t) : 1);

  const points: YearDataPoint[] = [];
  const pushAnspar = (y: number) => {
    const d = deflate(y);
    points.push({
      year: START_YEAR + y,
      age: s.startAge + y,
      btc: btc / d,
      etf: etf / d,
      total: (btc + etf) / d,
      rest: null,
      target: neededCapital / deflate(YEARS),
      possibleRent: ((btc + etf) * s.withdrawRate) / 12 / d,
      phase: 'anspar',
    });
  };
  pushAnspar(0);

  for (let m = 0; m < N; m++) {
    if (m === crashAtMonth) btc *= 1 - s.crashPct;
    const y = Math.floor(m / 12);
    const btcM = monthly(btcRateAtYear(s, y, YEARS));
    btc *= btcM;
    holdingOnly *= btcM;
    etf *= etfM;

    const inGlide = glideMonths > 0 && m >= glideStart;
    if (inGlide) {
      const sold = btc * glideSellPerMonth; // nach 1 Jahr Haltedauer steuerfrei
      btc -= sold;
      etf += sold;
      etfBasis += sold;
    }
    // Sparraten am Monatsende; in der Umschichtungsphase fließt auch die BTC-Rate in den ETF
    if (inGlide) {
      etf += s.btcSave + s.etfSave;
      etfBasis += s.btcSave + s.etfSave;
    } else {
      btc += s.btcSave;
      etf += s.etfSave;
      etfBasis += s.etfSave;
    }
    if (m % 12 === 11) pushAnspar(y + 1);
  }
  if (crashAtMonth === N && N >= 0 && s.crashOn) btc *= 1 - s.crashPct;

  const btcFinal = btc;
  const etfFinal = etf;
  const total = btcFinal + etfFinal;
  const latentTax = s.taxOn ? Math.max(0, etfFinal - etfBasis) * ETF_TAX : 0;
  const capitalNet = total - latentTax;

  // Übergabepunkt, damit die Restkapital-Linie an die Gesamtlinie anschließt
  if (points.length) {
    const last = points[points.length - 1];
    last.btc = btcFinal / deflate(YEARS);
    last.etf = etfFinal / deflate(YEARS);
    last.total = total / deflate(YEARS);
    last.rest = capitalNet / deflate(YEARS);
  }

  const gap = neededCapital - capitalNet;
  const achievable = (capitalNet * s.withdrawRate) / 12;
  const i = etfM - 1;
  const fvFactor = N > 0 ? (Math.pow(1 + i, N) - 1) / i : 0;
  const neededEtfRate = gap > 0 && fvFactor > 0 ? gap / fvFactor : 0;

  // ── Entnahmephase: monatlich, Entnahme steigt mit der Inflation ──
  const retM = monthly(s.retireReturn);
  let capital = capitalNet;
  let depletionAge: number | null = null;
  const drawYears = Math.max(0, s.lifeExp - s.retireAge);
  for (let y = 0; y < drawYears; y++) {
    for (let m = 0; m < 12; m++) {
      if (capital <= 0) break;
      const draw = rentTargetNominal * Math.pow(1 + s.inflRate, (y * 12 + m) / 12);
      capital = capital * retM - draw;
      if (capital < 0) {
        depletionAge = s.retireAge + y + (m + 1) / 12;
        capital = 0;
      }
    }
    const t = YEARS + y + 1;
    points.push({
      year: START_YEAR + t,
      age: s.retireAge + y + 1,
      btc: null,
      etf: null,
      total: null,
      rest: capital / deflate(t),
      target: neededCapital / deflate(YEARS),
      possibleRent: (capital * s.withdrawRate) / 12 / deflate(t),
      phase: 'entnahme',
    });
  }

  // Geometrisches Mittel der BTC-Rendite über die Laufzeit
  let factor = 1;
  for (let y = 0; y < YEARS; y++) factor *= 1 + btcRateAtYear(s, y, YEARS);
  const btcAvgRate = YEARS > 0 ? Math.pow(factor, 1 / YEARS) - 1 : s.btcRate;

  const dR = deflate(YEARS);
  return {
    years: YEARS,
    startYear: START_YEAR,
    retireYear: START_YEAR + YEARS,
    crashYear: s.crashOn ? START_YEAR + Math.max(0, YEARS - s.crashYearsBefore) : null,
    glideStartYear: s.glideOn ? START_YEAR + Math.max(0, YEARS - s.glideYears) : null,
    btcAvgRate,
    btcCurrentValue,
    btcSats: Math.round(s.btcAmount * 1e8),
    btcSupplyShare: (s.btcAmount / BTC_SUPPLY) * 100,
    btcHoldingFinal: holdingOnly / dR,
    btcFinal: btcFinal / dR,
    etfFinal: etfFinal / dR,
    etfContributions: etfBasis / dR,
    total: total / dR,
    latentTax: latentTax / dR,
    capitalNet: capitalNet / dR,
    rentTargetNominal,
    neededCapital: neededCapital / dR,
    gap: gap / dR,
    achievable: achievable / dR,
    neededEtfRate,
    purchasingPower1000: 1000 / Math.pow(1 + s.inflRate, YEARS),
    points,
    restCapital: capital / deflate(YEARS + drawYears),
    depletionAge,
    drawYears,
  };
}

// ── Formatierung ──
export function fmt(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return '–';
  if (Math.abs(n) >= 1_000_000)
    return `${(n / 1_000_000).toLocaleString('de-DE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} Mio. €`;
  return `${Math.round(n).toLocaleString('de-DE')} €`;
}

export function fmtShort(n: number | null | undefined): string {
  if (n === null || n === undefined || !Number.isFinite(n)) return '–';
  const sign = n < 0 ? '−' : '';
  const a = Math.abs(n);
  if (a >= 1_000_000)
    return `${sign}${(a / 1_000_000).toLocaleString('de-DE', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} M €`;
  if (a >= 1000) return `${sign}${Math.round(a / 1000).toLocaleString('de-DE')}k €`;
  return `${sign}${Math.round(a).toLocaleString('de-DE')} €`;
}

export function pct(rate: number, digits = 1): string {
  return `${(rate * 100).toLocaleString('de-DE', { maximumFractionDigits: digits })} %`;
}

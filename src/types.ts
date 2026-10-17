export interface PlannerState {
  // Person & Zeitraum
  startAge: number;
  retireAge: number;
  lifeExp: number;
  // Bitcoin
  btcAmount: number;
  btcPrice: number;
  btcSave: number;
  btcRate: number; // konstante Rendite bzw. Startrendite bei Abnahme
  btcDecay: boolean; // Rendite nimmt über die Laufzeit ab
  btcRateEnd: number; // Endrendite bei Abnahme
  // ETF
  etfSave: number;
  etfRate: number;
  // Inflation & Ziel
  inflRate: number;
  rentTarget: number; // in heutiger Kaufkraft
  // Rentenphase
  withdrawRate: number; // Entnahmequote (z. B. 4 %-Regel)
  retireReturn: number; // Rendite des Kapitals während der Rente
  // Risiko & Steuern
  crashOn: boolean;
  crashPct: number;
  crashYearsBefore: number;
  glideOn: boolean;
  glideYears: number;
  glidePct: number;
  taxOn: boolean;
  // Anzeige
  showReal: boolean;
}

export type Phase = 'anspar' | 'entnahme';

export interface YearDataPoint {
  year: number;
  age: number;
  btc: number | null;
  etf: number | null;
  total: number | null;
  rest: number | null;
  target: number;
  possibleRent: number;
  phase: Phase;
}

export interface PlannerResult {
  years: number;
  startYear: number;
  retireYear: number;
  crashYear: number | null;
  glideStartYear: number | null;
  btcAvgRate: number;
  btcCurrentValue: number;
  btcSats: number;
  btcSupplyShare: number;
  btcHoldingFinal: number;
  btcFinal: number;
  etfFinal: number;
  etfContributions: number;
  total: number;
  latentTax: number;
  capitalNet: number;
  rentTargetNominal: number;
  neededCapital: number;
  gap: number;
  achievable: number;
  neededEtfRate: number;
  purchasingPower1000: number;
  points: YearDataPoint[];
  restCapital: number;
  depletionAge: number | null;
  drawYears: number;
}

export interface RenditeLevel {
  max: number;
  tone: 'green' | 'blue' | 'amber' | 'red';
  label: string;
  context: string;
  note: string;
}

export type TabId = 'bestand' | 'btcplan' | 'etfplan' | 'inflation' | 'entnahme' | 'risiko' | 'ziel';

export type Setter = <K extends keyof PlannerState>(key: K, value: PlannerState[K]) => void;

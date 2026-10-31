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
  avOn: boolean; // Teil der ETF-Sparrate ins geförderte Altersvorsorgedepot
  avSave: number; // davon monatlich ins Altersvorsorgedepot
  avTaxRate: number; // persönlicher Steuersatz auf die Auszahlungen
  // Inflation & Ziel
  inflRate: number;
  rentTarget: number; // in heutiger Kaufkraft
  // Gesetzliche Rente
  pointsKnown: boolean; // Rentenpunkte aus der Renteninformation statt geschätzt
  pensionPoints: number; // Entgeltpunkte heute, wenn bekannt
  workYears: number; // bisherige Arbeitsjahre für die Schätzung
  grossSalary: number; // Bruttogehalt im Monat
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
  rentTargetDisplay: number; // Wunschrente in der gewählten Anzeige (heute oder nominal)
  fundedPct: number; // erreichbare Rente / Wunschrente
  neededCapital: number;
  gap: number;
  achievable: number;
  neededEtfRate: number;
  purchasingPower1000: number;
  points: YearDataPoint[];
  restCapital: number;
  depletionAge: number | null;
  drawYears: number;
  // Gesetzliche Rente
  pointsPerYear: number;
  pointsToday: number;
  pointsAtRetire: number;
  pensionYear: number;
  statePensionToday: number; // brutto im Monat, immer in heutiger Kaufkraft
  statePension: number; // brutto im Monat ab Regelaltersgrenze, in der gewählten Anzeige
  totalPension: number; // gesetzliche Rente + Zusatzrente + Altersvorsorgedepot ab Regelaltersgrenze, in der gewählten Anzeige
  // Altersvorsorgedepot (alle Beträge in der gewählten Anzeige)
  avPayoutAge: number;
  avPlanEndAge: number;
  avContributions: number;
  avGrants: number;
  avAtPayout: number;
  avPayout: number; // monatlich zu Beginn der Auszahlung, nach Steuern, wenn Steuern an
}

export interface RenditeLevel {
  max: number;
  tone: 'ok' | 'info' | 'warn' | 'bad';
  label: string;
  context: string;
  note: string;
}

export type TabId = 'ziel' | 'bitcoin' | 'etf' | 'annahmen' | 'risiko';

export type Setter = <K extends keyof PlannerState>(key: K, value: PlannerState[K]) => void;

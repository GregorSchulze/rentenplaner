import { describe, expect, it } from 'vitest';
import {
  BTC_SUPPLY,
  DEFAULT_STATE,
  ETF_TAX,
  RENDITE_LEVELS,
  SCENARIOS,
  START_YEAR,
  applyChange,
  btcRateAtYear,
  calculate,
  fmt,
  fmtShort,
  getRenditeLevel,
  pct,
  sanitizeState,
} from './calc';
import type { PlannerState } from './types';

const state = (overrides: Partial<PlannerState> = {}): PlannerState => ({ ...DEFAULT_STATE, ...overrides });

/** Vergleich mit relativer Toleranz, weil Beträge von Cent bis Millionen reichen. */
function expectNear(actual: number, expected: number, rel = 1e-9) {
  expect(Math.abs(actual - expected), `${actual} ≈ ${expected}`).toBeLessThanOrEqual(rel * Math.max(1, Math.abs(expected)));
}

// Standard: 29 → 60, also 31 Ansparjahre bzw. 372 Monate
const YEARS = DEFAULT_STATE.retireAge - DEFAULT_STATE.startAge;
const N = YEARS * 12;

/** Nur BTC, ohne Rendite und nominal: Werte lassen sich von Hand nachrechnen. */
const flatBtc = (overrides: Partial<PlannerState> = {}) =>
  state({ btcAmount: 1, btcPrice: 10_000, btcSave: 100, btcRate: 0, etfSave: 0, etfRate: 0, showReal: false, ...overrides });

describe('calculate – Ansparphase', () => {
  it('reiner ETF-Sparplan entspricht der Endwertformel (Raten am Monatsende)', () => {
    const r = calculate(state({ etfSave: 100, etfRate: 0.07, showReal: false }));
    const i = Math.pow(1.07, 1 / 12) - 1; // effektiver Jahreszins, monatlich verzinst
    const fv = (100 * (Math.pow(1 + i, N) - 1)) / i;

    expect(r.years).toBe(YEARS);
    expect(r.retireYear).toBe(START_YEAR + YEARS);
    expectNear(r.etfFinal, fv);
    expectNear(r.total, fv);
    expect(r.btcFinal).toBe(0);
    expectNear(r.etfContributions, 100 * N);
  });

  it('ohne Rendite ist der Endwert genau die Summe der Einzahlungen', () => {
    const r = calculate(state({ etfSave: 250, etfRate: 0, showReal: false }));
    expect(r.etfFinal).toBe(250 * N);
    expect(r.etfContributions).toBe(250 * N);
  });

  it('BTC-Bestand wächst mit der Jahresrendite, Kennzahlen zum Bestand stimmen', () => {
    const r = calculate(state({ btcAmount: 0.5, btcPrice: 60_000, btcRate: 0.15, etfSave: 0, showReal: false }));
    expect(r.btcCurrentValue).toBe(30_000);
    expectNear(r.btcFinal, 30_000 * Math.pow(1.15, YEARS));
    expectNear(r.btcHoldingFinal, r.btcFinal);
    expect(r.btcSats).toBe(50_000_000);
    expect(r.btcSupplyShare).toBeCloseTo((0.5 / BTC_SUPPLY) * 100, 15);
    expectNear(r.btcAvgRate, 0.15);
  });

  it('abnehmende BTC-Rendite: Durchschnitt ist das geometrische Mittel der Jahresrenditen', () => {
    const s = state({ btcAmount: 1, btcPrice: 10_000, btcRate: 0.3, btcDecay: true, btcRateEnd: 0.05, etfSave: 0, showReal: false });
    const r = calculate(s);
    let factor = 1;
    for (let y = 0; y < YEARS; y++) factor *= 1 + btcRateAtYear(s, y, YEARS);

    expectNear(r.btcFinal, 10_000 * factor);
    expectNear(Math.pow(1 + r.btcAvgRate, YEARS), factor);
    expect(r.btcAvgRate).toBeGreaterThan(0.05);
    expect(r.btcAvgRate).toBeLessThan(0.3);
  });

  it('liefert einen Datenpunkt pro Jahr; der Übergabepunkt verbindet beide Phasen', () => {
    const s = state({ etfSave: 300 });
    const r = calculate(s);

    expect(r.drawYears).toBe(s.lifeExp - s.retireAge);
    expect(r.points).toHaveLength(YEARS + 1 + r.drawYears);
    expect(r.points[0]).toMatchObject({ year: START_YEAR, age: s.startAge, total: 0, phase: 'anspar' });

    const handover = r.points[YEARS];
    expect(handover).toMatchObject({ age: s.retireAge, phase: 'anspar' });
    expectNear(handover.total ?? NaN, r.total);
    expectNear(handover.rest ?? NaN, r.capitalNet);

    expect(r.points[YEARS + 1]).toMatchObject({ age: s.retireAge + 1, phase: 'entnahme', total: null });
    expect(r.points.at(-1)?.age).toBe(s.lifeExp);
  });
});

describe('calculate – Kapitalbedarf und Kaufkraft', () => {
  it('nötiges Kapital = Jahresrente ÷ Entnahmequote', () => {
    const real = calculate(state({ rentTarget: 3000, withdrawRate: 0.04, showReal: true }));
    expectNear(real.neededCapital, (3000 * 12) / 0.04); // 900.000 € in heutiger Kaufkraft
    expectNear(real.rentTargetDisplay, 3000);

    const nominal = calculate(state({ rentTarget: 2000, withdrawRate: 0.035, inflRate: 0.02, showReal: false }));
    const rentNominal = 2000 * Math.pow(1.02, YEARS);
    expectNear(nominal.rentTargetNominal, rentNominal);
    expectNear(nominal.neededCapital, (rentNominal * 12) / 0.035);
  });

  it('heutige Kaufkraft = nominaler Wert ÷ (1 + Inflation)^Jahre', () => {
    const s = state({ btcAmount: 0.2, btcSave: 50, etfSave: 200, inflRate: 0.025, taxOn: true, glideOn: true, crashOn: true });
    const real = calculate({ ...s, showReal: true });
    const nominal = calculate({ ...s, showReal: false });
    const d = Math.pow(1.025, YEARS);

    const fields = ['btcFinal', 'etfFinal', 'etfContributions', 'total', 'latentTax', 'capitalNet', 'neededCapital', 'gap', 'achievable'] as const;
    for (const f of fields) expectNear(real[f] * d, nominal[f]);
    expectNear(real.restCapital * Math.pow(1.025, YEARS + real.drawYears), nominal.restCapital);

    // Verhältnisse und nominale Größen hängen nicht von der Anzeige ab
    expect(real.fundedPct).toBe(nominal.fundedPct);
    expect(real.rentTargetNominal).toBe(nominal.rentTargetNominal);
    expect(real.neededEtfRate).toBe(nominal.neededEtfRate);
    expectNear(real.purchasingPower1000, 1000 / d);

    // Jeder Jahrespunkt wird mit seinem eigenen Jahr abgezinst
    for (const y of [1, 10, YEARS - 1]) {
      expectNear((real.points[y].total ?? NaN) * Math.pow(1.025, y), nominal.points[y].total ?? NaN);
    }
  });

  it('erreichbare Rente, Deckungsgrad und Lücke hängen konsistent zusammen', () => {
    const r = calculate(state({ etfSave: 400, btcAmount: 0.1, rentTarget: 2500, withdrawRate: 0.04 }));
    expectNear(r.achievable, (r.capitalNet * 0.04) / 12);
    expectNear(r.fundedPct, r.achievable / 2500);
    expectNear(r.gap, r.neededCapital - r.capitalNet);
  });

  it('die vorgeschlagene zusätzliche ETF-Rate schließt die Lücke genau', () => {
    const s = state({ etfSave: 100, rentTarget: 3000 });
    const before = calculate(s);
    expect(before.gap).toBeGreaterThan(0);
    expect(before.neededEtfRate).toBeGreaterThan(0);

    const after = calculate({ ...s, etfSave: s.etfSave + before.neededEtfRate });
    expect(Math.abs(after.gap)).toBeLessThan(0.01);
    expectNear(after.fundedPct, 1);
  });

  it('ohne Lücke ist keine zusätzliche ETF-Rate nötig', () => {
    const r = calculate(state({ btcAmount: 50 }));
    expect(r.gap).toBeLessThan(0);
    expect(r.neededEtfRate).toBe(0);
  });
});

describe('calculate – Crash-Stresstest', () => {
  it('Einbruch trifft genau den ersten Monat des Crash-Jahres', () => {
    const r = calculate(flatBtc({ crashOn: true, crashPct: 0.5, crashYearsBefore: 3 }));
    const crashMonth = (YEARS - 3) * 12;

    expect(r.crashYear).toBe(START_YEAR + YEARS - 3);
    // Einen Monat früher oder später ergäbe 50 € Unterschied
    expect(r.btcFinal).toBe((10_000 + 100 * crashMonth) * 0.5 + 100 * (N - crashMonth));
    // Jahresende vor dem Crash: noch voller Wert; ein Jahr später: halbiert plus zwölf Raten
    expect(r.points[YEARS - 3].btc).toBe(10_000 + 100 * crashMonth);
    expect(r.points[YEARS - 2].btc).toBe((10_000 + 100 * crashMonth) * 0.5 + 1200);
  });

  it('0 Jahre vorher: Einbruch genau zum Rentenbeginn, nach der letzten Rate', () => {
    const r = calculate(flatBtc({ crashOn: true, crashPct: 0.5, crashYearsBefore: 0 }));

    expect(r.crashYear).toBe(r.retireYear);
    expect(r.btcFinal).toBe((10_000 + 100 * N) * 0.5);
    expect(r.points[YEARS - 1].btc).toBe(10_000 + 100 * (N - 12));
    expect(r.points[YEARS].btc).toBe(r.btcFinal);
  });

  it('mehr Jahre vorher als Ansparzeit: Einbruch im ersten Monat', () => {
    const r = calculate(flatBtc({ crashOn: true, crashPct: 0.5, crashYearsBefore: YEARS + 5 }));
    expect(r.crashYear).toBe(START_YEAR);
    expect(r.btcFinal).toBe(10_000 * 0.5 + 100 * N);
  });

  it('trifft nur BTC, nicht den ETF', () => {
    const s = state({ btcAmount: 1, btcSave: 100, etfSave: 200 });
    const ohne = calculate(s);
    const mit = calculate({ ...s, crashOn: true, crashPct: 0.75, crashYearsBefore: 2 });
    expect(mit.etfFinal).toBe(ohne.etfFinal);
    expect(mit.btcFinal).toBeLessThan(ohne.btcFinal);
  });

  it('ist ausgeschaltet ohne Wirkung', () => {
    const s = flatBtc({ crashPct: 0.9, crashYearsBefore: 0 });
    const r = calculate(s);
    expect(r.crashYear).toBeNull();
    expect(r.btcFinal).toBe(10_000 + 100 * N);
  });
});

describe('calculate – Umschichtung BTC → ETF', () => {
  it('verkauft den gewählten Anteil und leitet die BTC-Rate in den ETF', () => {
    const glideMonths = 5 * 12;
    const before = N - glideMonths;
    const btcAtStart = 10_000 + 100 * before;
    const r = calculate(flatBtc({ etfSave: 50, glideOn: true, glideYears: 5, glidePct: 0.8 }));

    expect(r.glideStartYear).toBe(START_YEAR + YEARS - 5);
    // Ab Beginn der Umschichtung kommt kein BTC mehr dazu, 80 % des Bestands wandern in den ETF
    expectNear(r.btcFinal, btcAtStart * 0.2);
    expectNear(r.etfFinal, 50 * before + btcAtStart * 0.8 + 150 * glideMonths);
    // Ohne Rendite bleibt die Summe aller Einzahlungen erhalten
    expectNear(r.total, 10_000 + 150 * N);
  });

  it('verkaufte BTC zählen als Einstand: BTC-Gewinne lösen keine ETF-Steuer aus', () => {
    const r = calculate(
      state({ btcAmount: 1, btcRate: 0.15, etfSave: 100, etfRate: 0, glideOn: true, glideYears: 10, glidePct: 1, taxOn: true }),
    );
    expect(r.btcFinal).toBeCloseTo(0, 6);
    expect(r.etfFinal).toBeGreaterThan(r.btcCurrentValue);
    expect(r.latentTax).toBeCloseTo(0, 6);
  });
});

describe('calculate – Steuern', () => {
  it('ETF-Steuersatz: 25 % + Soli, 30 % Teilfreistellung', () => {
    expect(ETF_TAX).toBeCloseTo(0.184625, 12);
  });

  it('latente Steuer nur auf ETF-Kursgewinne, nicht auf Einzahlungen', () => {
    const s = state({ etfSave: 200, etfRate: 0.07, showReal: false });
    const ohne = calculate(s);
    const mit = calculate({ ...s, taxOn: true });

    expect(ohne.latentTax).toBe(0);
    expect(ohne.capitalNet).toBe(ohne.total);
    expectNear(mit.latentTax, (mit.etfFinal - 200 * N) * ETF_TAX);
    expectNear(mit.capitalNet, mit.total - mit.latentTax);
    expect(mit.total).toBe(ohne.total);
  });

  it('BTC-Gewinne bleiben nach einem Jahr Haltedauer steuerfrei', () => {
    const r = calculate(state({ btcAmount: 1, btcSave: 200, etfSave: 0, taxOn: true }));
    expect(r.btcFinal).toBeGreaterThan(0);
    expect(r.latentTax).toBe(0);
    expect(r.capitalNet).toBe(r.total);
  });
});

describe('calculate – Entnahmephase', () => {
  /** Ein Jahr Ansparen, keine Rendite, keine Inflation: 1.000 € im Monat entnehmen. */
  const draw = (capital: number) =>
    state({
      startAge: 59,
      retireAge: 60,
      lifeExp: 85,
      btcAmount: 1,
      btcPrice: capital,
      btcRate: 0,
      etfSave: 0,
      inflRate: 0,
      rentTarget: 1000,
      retireReturn: 0,
      showReal: false,
    });

  it('depletionAge ist monatsgenau das Alter, in dem das Geld aufgebraucht ist', () => {
    const r = calculate(draw(10_500));
    // Zehn volle Entnahmen, die elfte reicht nicht mehr
    expect(r.depletionAge).toBeCloseTo(60 + 11 / 12, 12);
    expect(r.restCapital).toBe(0);
    expect(r.points.at(-1)?.rest).toBe(0);
  });

  it('depletionAge ist null, wenn das Geld bis zum Lebensende reicht', () => {
    const r = calculate(draw(1000 * 12 * 25 + 1));
    expect(r.depletionAge).toBeNull();
    expect(r.restCapital).toBeCloseTo(1, 6);

    const reich = calculate(state({ btcAmount: 10 }));
    expect(reich.depletionAge).toBeNull();
    expect(reich.restCapital).toBeGreaterThan(0);
  });

  it('Entnahme steigt mit der Inflation', () => {
    const ohne = calculate({ ...draw(100_500), inflRate: 0 });
    const mit = calculate({ ...draw(100_500), inflRate: 0.03 });
    expect(ohne.depletionAge).toBeCloseTo(60 + 101 / 12, 12);
    expect(mit.depletionAge ?? Infinity).toBeLessThan(ohne.depletionAge ?? 0);
  });

  // Bekannter Fehler: Steht das Kapital auf genau 0, bricht die Schleife ab, ohne depletionAge zu setzen,
  // und die App meldet „reicht bis Lebensende“. Sobald calculate() das korrigiert, schlagen diese Tests
  // fehl – dann `it.fails` durch `it` ersetzen.
  it.fails('ohne Kapital ist das Geld im ersten Rentenmonat aufgebraucht', () => {
    const r = calculate(state({ btcAmount: 0, btcSave: 0, etfSave: 0 }));
    expect(r.capitalNet).toBe(0);
    expect(r.depletionAge).toBeCloseTo(60 + 1 / 12, 12);
  });

  it.fails('Kapital genau 0 nach einer Entnahme: die nächste Entnahme fällt aus', () => {
    const r = calculate(draw(100_000)); // genau 100 Monatsentnahmen
    expect(r.depletionAge).toBeCloseTo(60 + 101 / 12, 12);
  });
});

describe('btcRateAtYear', () => {
  it('ist ohne Abnahme konstant', () => {
    const s = state({ btcRate: 0.15, btcDecay: false, btcRateEnd: 0.05 });
    expect(btcRateAtYear(s, 0, 30)).toBe(0.15);
    expect(btcRateAtYear(s, 29, 30)).toBe(0.15);
  });

  it('nimmt linear von der Start- zur Endrendite ab', () => {
    const s = state({ btcRate: 0.3, btcDecay: true, btcRateEnd: 0.1 });
    expect(btcRateAtYear(s, 0, 11)).toBe(0.3);
    expect(btcRateAtYear(s, 5, 11)).toBeCloseTo(0.2, 12);
    expect(btcRateAtYear(s, 10, 11)).toBeCloseTo(0.1, 12);
  });

  it('nutzt bei höchstens einem Jahr die Startrendite', () => {
    const s = state({ btcRate: 0.3, btcDecay: true, btcRateEnd: 0.1 });
    expect(btcRateAtYear(s, 0, 1)).toBe(0.3);
    expect(btcRateAtYear(s, 0, 0)).toBe(0.3);
  });
});

describe('getRenditeLevel', () => {
  it.each([
    [0, 'Sehr konservativ'],
    [8, 'Sehr konservativ'],
    [8.5, 'Realistisch (Empfehlung)'],
    [15, 'Realistisch (Empfehlung)'],
    [15.5, 'Optimistisch'],
    [25, 'Optimistisch'],
    [29, 'Bullen-Szenario'],
    [100, 'Bullen-Szenario'],
  ])('%d %% → %s', (rate, label) => {
    expect(getRenditeLevel(rate).label).toBe(label);
  });

  it('fällt über 100 % auf die höchste Stufe zurück', () => {
    expect(getRenditeLevel(250)).toBe(RENDITE_LEVELS.at(-1));
  });

  it('ordnet die VanEck-Szenarien der passenden Stufe zu', () => {
    const tones = SCENARIOS.map((sc) => getRenditeLevel(sc.rate * 100).tone);
    expect(tones).toEqual(['ok', 'info', 'bad']);
  });
});

describe('applyChange', () => {
  it('begrenzt das Startalter auf 16 bis 64 und rundet auf ganze Jahre', () => {
    expect(applyChange(DEFAULT_STATE, 'startAge', 10).startAge).toBe(16);
    expect(applyChange(DEFAULT_STATE, 'startAge', 80).startAge).toBe(64);
    expect(applyChange(DEFAULT_STATE, 'startAge', 30.6).startAge).toBe(31);
  });

  it('hält den Renteneintritt zwischen 40 bzw. Startalter + 1 und 65', () => {
    expect(applyChange(DEFAULT_STATE, 'retireAge', 30).retireAge).toBe(40);
    expect(applyChange(DEFAULT_STATE, 'retireAge', 70).retireAge).toBe(65);
    expect(applyChange(state({ startAge: 50 }), 'retireAge', 45).retireAge).toBe(51);
  });

  it('schiebt den Renteneintritt mit, wenn das Startalter steigt', () => {
    const next = applyChange(state({ retireAge: 60 }), 'startAge', 62);
    expect(next).toMatchObject({ startAge: 62, retireAge: 63 });
  });

  it('hält die Lebenserwartung über dem Renteneintritt', () => {
    expect(applyChange(DEFAULT_STATE, 'lifeExp', 50).lifeExp).toBe(61);
    expect(applyChange(state({ lifeExp: 62 }), 'retireAge', 65)).toMatchObject({ retireAge: 65, lifeExp: 66 });
    expect(applyChange(DEFAULT_STATE, 'lifeExp', 95).lifeExp).toBe(95);
  });

  it('kürzt Crash- und Umschichtungsjahre auf die Ansparzeit', () => {
    const s = state({ crashYearsBefore: 10, glideYears: 10 });
    const next = applyChange(s, 'startAge', 57); // Rente mit 60 → 3 Ansparjahre
    expect(next).toMatchObject({ crashYearsBefore: 3, glideYears: 3 });
  });

  it('verändert den vorherigen Zustand nicht', () => {
    const prev = Object.freeze(state());
    const next = applyChange(prev, 'retireAge', 99);
    expect(next).not.toBe(prev);
    expect(prev.retireAge).toBe(DEFAULT_STATE.retireAge);
  });
});

describe('sanitizeState', () => {
  it.each([null, undefined, 'text', 42, true, []])('liefert für %j die Standardwerte', (raw) => {
    expect(sanitizeState(raw)).toEqual(DEFAULT_STATE);
  });

  it('übernimmt gültige Werte und ergänzt fehlende', () => {
    const s = sanitizeState({ startAge: 35, btcDecay: true, etfRate: 0.05 });
    expect(s).toEqual({ ...DEFAULT_STATE, startAge: 35, btcDecay: true, etfRate: 0.05 });
  });

  it('verwirft falsche Typen und nicht endliche Zahlen', () => {
    const s = sanitizeState({
      startAge: '35',
      retireAge: Number.NaN,
      lifeExp: Number.POSITIVE_INFINITY,
      etfSave: null,
      btcDecay: 'true',
      taxOn: 1,
      showReal: { value: false },
    });
    expect(s).toEqual(DEFAULT_STATE);
  });

  it('ignoriert unbekannte Schlüssel und __proto__', () => {
    const s = sanitizeState(JSON.parse('{"__proto__": {"polluted": true}, "evil": "x", "startAge": 30}'));
    expect(s).toEqual({ ...DEFAULT_STATE, startAge: 30 });
    expect(Object.keys(s).sort()).toEqual(Object.keys(DEFAULT_STATE).sort());
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });

  it('bringt unsinnige Alter in gültige Bereiche', () => {
    expect(sanitizeState({ startAge: 5, retireAge: 99, lifeExp: 20 })).toMatchObject({ startAge: 16, retireAge: 65, lifeExp: 66 });
    expect(sanitizeState({ startAge: 64, retireAge: 30 })).toMatchObject({ startAge: 64, retireAge: 65 });
  });

  it('liefert einen Zustand, mit dem calculate endliche Werte ergibt', () => {
    const r = calculate(sanitizeState({ startAge: -1, retireAge: 'x', crashOn: true, crashYearsBefore: 1e9, glideOn: true, glideYears: -3 }));
    for (const v of [r.total, r.capitalNet, r.neededCapital, r.gap, r.achievable, r.restCapital]) expect(Number.isFinite(v)).toBe(true);
  });
});

describe('Formatierung', () => {
  it.each([null, undefined, Number.NaN, Number.POSITIVE_INFINITY])('zeigt %s als Strich', (v) => {
    expect(fmt(v)).toBe('–');
    expect(fmtShort(v)).toBe('–');
  });

  it.each([
    [0, '0 €'],
    [1234.4, '1.234 €'],
    [999.5, '1.000 €'],
    [-1234, '-1.234 €'],
    [1_234_567, '1,23 Mio. €'],
    [-2_500_000, '-2,50 Mio. €'],
  ])('fmt(%d) → %s', (n, out) => {
    expect(fmt(n)).toBe(out);
  });

  it.each([
    [0, '0 €'],
    [999, '999 €'],
    [1500, '2k €'],
    [12_345, '12k €'],
    [-1500, '−2k €'],
    [2_500_000, '2,5 M €'],
    [-2_500_000, '−2,5 M €'],
  ])('fmtShort(%d) → %s', (n, out) => {
    expect(fmtShort(n)).toBe(out);
  });

  it('pct rechnet Anteile in Prozent um, mit wählbaren Nachkommastellen', () => {
    expect(pct(0.15)).toBe('15 %');
    expect(pct(0.075)).toBe('7,5 %');
    expect(pct(0.001)).toBe('0,1 %');
    expect(pct(0.1234, 2)).toBe('12,34 %');
    expect(pct(ETF_TAX, 0)).toBe('18 %');
  });
});

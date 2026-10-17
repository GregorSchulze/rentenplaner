import { SCENARIOS, getRenditeLevel, pct } from '../calc';
import { TONES } from '../theme';
import type { PlannerResult, PlannerState, Setter } from '../types';
import { InfoBox, Note } from './InfoBox';
import { SliderRow } from './SliderRow';
import { Segmented, Toggle } from './Toggle';

interface Props {
  s: PlannerState;
  set: Setter;
  r: PlannerResult;
}

export function TabBtcSparplan({ s, set, r }: Props) {
  const level = getRenditeLevel(r.btcAvgRate * 100);
  const activeScenario = s.btcDecay ? null : (SCENARIOS.find((sc) => Math.abs(sc.rate - s.btcRate) < 1e-9)?.id ?? null);

  return (
    <div>
      <SliderRow
        label="Monatliche BTC-Sparrate"
        value={s.btcSave}
        min={0}
        max={500}
        step={5}
        display={`${s.btcSave} €/Mo`}
        onChange={(v) => set('btcSave', v)}
      />

      <div style={{ fontSize: 13, color: '#78716c', marginBottom: 8 }}>Szenario (VanEck, Langfrist-Annahmen bis 2050)</div>
      <div style={{ marginBottom: 18 }}>
        <Segmented
          ariaLabel="Szenario"
          value={activeScenario}
          options={SCENARIOS.map((sc) => ({ value: sc.id, label: `${sc.label} · ${sc.hint}` }))}
          onChange={(id) => {
            const sc = SCENARIOS.find((x) => x.id === id);
            if (!sc) return;
            set('btcDecay', false);
            set('btcRate', sc.rate);
          }}
        />
      </div>

      <Toggle
        label="Abnehmende Rendite"
        description="Rendite sinkt linear von der Start- zur Endrendite – realistischer, weil das Wachstum mit der Marktgröße nachlässt."
        checked={s.btcDecay}
        onChange={(v) => set('btcDecay', v)}
      />

      <SliderRow
        label={s.btcDecay ? 'Startrendite p.a.' : 'BTC-Rendite p.a.'}
        value={s.btcRate * 100}
        min={0}
        max={40}
        step={0.5}
        display={pct(s.btcRate)}
        onChange={(v) => set('btcRate', v / 100)}
      />
      {s.btcDecay && (
        <SliderRow
          label={`Endrendite p.a. (im Jahr ${r.retireYear})`}
          value={s.btcRateEnd * 100}
          min={0}
          max={30}
          step={0.5}
          display={pct(s.btcRateEnd)}
          onChange={(v) => set('btcRateEnd', v / 100)}
        />
      )}

      <InfoBox tone={level.tone}>
        <div style={{ fontWeight: 700, color: TONES[level.tone].text, marginBottom: 4 }}>
          {level.label} · Ø {pct(r.btcAvgRate)} p.a.
        </div>
        <div style={{ marginBottom: 3 }}>{level.context}</div>
        <div style={{ color: '#78716c' }}>{level.note}</div>
      </InfoBox>
      <Note>
        Zum Vergleich: Kurzfristige Bankprognosen bis 2030 liegen höher (teils 30–50 % p.a.), gelten aber nur für wenige
        Jahre. Für {r.years} Jahre ist eine Langfrist-Annahme die passendere Grundlage.
      </Note>
    </div>
  );
}

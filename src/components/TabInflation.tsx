import { fmt, pct } from '../calc';
import type { PlannerResult, PlannerState, Setter } from '../types';
import { InfoBox, Note } from './InfoBox';
import { SliderRow } from './SliderRow';

export function TabInflation({ s, set, r }: { s: PlannerState; set: Setter; r: PlannerResult }) {
  return (
    <div>
      <SliderRow
        label="Inflationsrate p.a."
        value={s.inflRate * 100}
        min={0.5}
        max={6}
        step={0.1}
        display={pct(s.inflRate)}
        onChange={(v) => set('inflRate', v / 100)}
      />
      <InfoBox tone="amber">
        <div>
          Kaufkraft von 1.000 € heute in {r.years} Jahren: <strong>{fmt(r.purchasingPower1000)}</strong>
        </div>
        <div>
          Rentenziel nominal mit {s.retireAge}: <strong>{fmt(r.rentTargetNominal)} /Mo</strong>
        </div>
        <div>
          Benötigtes Kapital{s.showReal ? ' (in heutiger Kaufkraft)' : ' (nominal)'}: <strong>{fmt(r.neededCapital)}</strong>
        </div>
      </InfoBox>
      <Note>
        Tipp: Oben auf „Heutige Kaufkraft" umschalten – dann zeigt die App alle Beträge so, wie sie sich heute anfühlen würden.
      </Note>
    </div>
  );
}

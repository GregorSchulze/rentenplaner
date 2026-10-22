import { RETIRE_MAX, retireMin } from '../calc';
import type { PlannerResult, PlannerState, Setter } from '../types';
import { InfoBox } from './InfoBox';
import { NumberField } from './NumberField';
import { SliderRow } from './SliderRow';

export function TabZiel({ s, set, r }: { s: PlannerState; set: Setter; r: PlannerResult }) {
  const short = r.years < 20;
  return (
    <div>
      <NumberField label="Mein Alter heute" value={s.startAge} min={16} max={RETIRE_MAX - 1} decimals={0} suffix="Jahre" onChange={(v) => set('startAge', v)} />
      <SliderRow
        label="Renteneintrittsalter"
        value={s.retireAge}
        min={retireMin(s)}
        max={RETIRE_MAX}
        step={1}
        display={`${s.retireAge} Jahre`}
        onChange={(v) => set('retireAge', v)}
      />
      <InfoBox tone={short ? 'red' : 'blue'}>
        <div>
          Ansparphase: <strong>{r.years} Jahre</strong> ({r.startYear}–{r.retireYear}) · Entnahmephase:{' '}
          <strong>{r.drawYears} Jahre</strong>
        </div>
        <div style={{ color: 'var(--sub)', marginTop: 3 }}>
          {short
            ? 'Kurze Ansparphase, lange Entnahmephase – der Zinseszins hat kaum Zeit zu wirken, und das Kapital muss länger reichen.'
            : 'Jedes Jahr später wirkt doppelt: mehr Zinseszins im Depot und ein Jahr weniger Entnahme.'}
        </div>
      </InfoBox>
      <SliderRow
        label="Gewünschte Zusatzrente (heutige Kaufkraft)"
        value={s.rentTarget}
        min={500}
        max={6000}
        step={50}
        display={`${s.rentTarget.toLocaleString('de-DE')} €/Mo`}
        onChange={(v) => set('rentTarget', v)}
      />
    </div>
  );
}

import { pct } from '../calc';
import type { PlannerState, Setter } from '../types';
import { Note } from './InfoBox';
import { SliderRow } from './SliderRow';

export function TabEtfSparplan({ s, set }: { s: PlannerState; set: Setter }) {
  return (
    <div>
      <SliderRow
        label="Monatliche ETF-Sparrate"
        value={s.etfSave}
        min={0}
        max={800}
        step={10}
        display={`${s.etfSave} €/Mo`}
        onChange={(v) => set('etfSave', v)}
      />
      <SliderRow
        label="ETF-Rendite p.a."
        value={s.etfRate * 100}
        min={4}
        max={12}
        step={0.5}
        display={pct(s.etfRate)}
        onChange={(v) => set('etfRate', v / 100)}
      />
      <Note>
        Zur Einordnung: Breite globale Aktien-ETFs (MSCI World / FTSE All-World) lagen historisch langfristig bei etwa 7–8 %
        nominal p.a. – mit erheblichen Schwankungen dazwischen.
      </Note>
    </div>
  );
}

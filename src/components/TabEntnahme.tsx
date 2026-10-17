import { fmt, pct } from '../calc';
import type { PlannerResult, PlannerState, Setter } from '../types';
import { InfoBox, Note } from './InfoBox';
import { SliderRow } from './SliderRow';

export function TabEntnahme({ s, set, r }: { s: PlannerState; set: Setter; r: PlannerResult }) {
  const ok = r.depletionAge === null;
  return (
    <div>
      <SliderRow
        label="Lebenserwartung"
        value={s.lifeExp}
        min={Math.max(70, s.retireAge + 1)}
        max={100}
        step={1}
        display={`${s.lifeExp} Jahre`}
        onChange={(v) => set('lifeExp', v)}
      />
      <SliderRow
        label="Entnahmequote p.a. (bestimmt das nötige Kapital)"
        value={s.withdrawRate * 100}
        min={2}
        max={6}
        step={0.1}
        display={pct(s.withdrawRate)}
        onChange={(v) => set('withdrawRate', v / 100)}
      />
      <SliderRow
        label="Rendite des Kapitals in der Rente p.a."
        value={s.retireReturn * 100}
        min={0}
        max={8}
        step={0.1}
        display={pct(s.retireReturn)}
        onChange={(v) => set('retireReturn', v / 100)}
      />
      <InfoBox tone={ok ? 'green' : 'red'}>
        <div>
          Entnahmejahre: <strong>{r.drawYears}</strong> (Alter {s.retireAge}–{s.lifeExp})
        </div>
        <div>
          Kapital hält bis Alter: <strong>{ok ? `${s.lifeExp}+ (reicht aus)` : Math.floor(r.depletionAge ?? 0)}</strong>
        </div>
        <div>
          Restkapital mit {s.lifeExp}: <strong>{fmt(r.restCapital)}</strong>
        </div>
      </InfoBox>
      <Note>
        Die Entnahmequote legt fest, wie viel Kapital für die Wunschrente nötig ist (4 % ≈ 25-faches Jahresziel). Die
        Rendite in der Rente bestimmt, wie lange das Kapital bei inflationsangepasster Entnahme tatsächlich reicht – hier
        eher vorsichtig ansetzen, da man in der Rente meist risikoärmer anlegt.
      </Note>
    </div>
  );
}

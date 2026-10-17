import { ETF_TAX, fmt, pct } from '../calc';
import type { PlannerResult, PlannerState, Setter } from '../types';
import { InfoBox, Note } from './InfoBox';
import { SliderRow } from './SliderRow';
import { Toggle } from './Toggle';

export function TabRisiko({ s, set, r }: { s: PlannerState; set: Setter; r: PlannerResult }) {
  return (
    <div>
      {/* Crash-Stresstest */}
      <Toggle
        label="Crash-Stresstest"
        description="Simuliert einen BTC-Einbruch ohne anschließende Erholung – zeigt, was im schlechten Fall übrig bleibt."
        checked={s.crashOn}
        onChange={(v) => set('crashOn', v)}
      />
      {s.crashOn && (
        <div style={{ paddingLeft: 4 }}>
          <SliderRow
            label="Einbruch"
            value={s.crashPct * 100}
            min={30}
            max={90}
            step={5}
            display={`−${Math.round(s.crashPct * 100)} %`}
            onChange={(v) => set('crashPct', v / 100)}
          />
          <SliderRow
            label="Zeitpunkt"
            value={s.crashYearsBefore}
            min={0}
            max={Math.min(15, r.years)}
            step={1}
            display={s.crashYearsBefore === 0 ? 'direkt zur Rente' : `${s.crashYearsBefore} J. vor Rente (${r.crashYear})`}
            onChange={(v) => set('crashYearsBefore', v)}
          />
        </div>
      )}

      {/* Umschichtung */}
      <Toggle
        label="BTC vor der Rente in ETF umschichten"
        description="Optional. Verkauft BTC schrittweise und legt den Erlös im ETF an; die BTC-Sparrate fließt in dieser Phase ebenfalls in den ETF."
        checked={s.glideOn}
        onChange={(v) => set('glideOn', v)}
      />
      {s.glideOn && (
        <div style={{ paddingLeft: 4 }}>
          <SliderRow
            label="Beginn der Umschichtung"
            value={s.glideYears}
            min={1}
            max={Math.max(1, Math.min(20, r.years))}
            step={1}
            display={`${s.glideYears} J. vor Rente (${r.glideStartYear})`}
            onChange={(v) => set('glideYears', v)}
          />
          <SliderRow
            label="Umzuschichtender Anteil des BTC-Bestands"
            value={s.glidePct * 100}
            min={10}
            max={100}
            step={5}
            display={`${Math.round(s.glidePct * 100)} %`}
            onChange={(v) => set('glidePct', v / 100)}
          />
          <Note>
            Hintergrund: Ein großer Crash kurz vor Rentenbeginn trifft am härtesten, weil keine Zeit zur Erholung bleibt.
            Am besten mit eingeschaltetem Crash-Test vergleichen.
          </Note>
        </div>
      )}

      {/* Steuern */}
      <Toggle
        label="Steuern berücksichtigen"
        description={`ETF-Gewinne effektiv ~${pct(ETF_TAX)} (Abgeltungsteuer + Soli, 30 % Teilfreistellung). BTC nach 1 Jahr Haltedauer steuerfrei.`}
        checked={s.taxOn}
        onChange={(v) => set('taxOn', v)}
      />
      {s.taxOn && (
        <InfoBox tone="amber">
          <div>
            ETF-Einzahlungen gesamt: <strong>{fmt(r.etfContributions)}</strong>
          </div>
          <div>
            Latente Steuer auf ETF-Gewinne: <strong>{fmt(r.latentTax)}</strong>
          </div>
          <div>
            Kapital nach Steuern: <strong>{fmt(r.capitalNet)}</strong>
          </div>
        </InfoBox>
      )}
      <Note>
        Vereinfachung: Die Steuer wird so berechnet, als würde der ETF zur Rente komplett verkauft (vorsichtig gerechnet).
        Sparerpauschbetrag, Kirchensteuer und Vorabpauschale bleiben unberücksichtigt. Steuerrecht kann sich ändern – keine
        Steuerberatung.
      </Note>
    </div>
  );
}

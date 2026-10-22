import { ETF_TAX, RETIRE_MAX, SCENARIOS, fmt, getRenditeLevel, pct, retireMin } from '../calc';
import type { PlannerResult, PlannerState, Setter } from '../types';
import { Callout, Group, NumberField, RadioGroup, Slider, Stat, Switch } from './Fields';

interface P {
  s: PlannerState;
  set: Setter;
  r: PlannerResult;
}

/* ── Ziel ── */
export function PanelZiel({ s, set, r }: P) {
  const short = r.years < 20;
  return (
    <>
      <Group legend="Zeitraum">
        <NumberField
          label="Mein Alter heute"
          value={s.startAge}
          min={16}
          max={RETIRE_MAX - 1}
          decimals={0}
          suffix="Jahre"
          onChange={(v) => set('startAge', v)}
        />
        <Slider
          label="Renteneintritt"
          value={s.retireAge}
          min={retireMin(s)}
          max={RETIRE_MAX}
          step={1}
          display={`mit ${s.retireAge}`}
          onChange={(v) => set('retireAge', v)}
        />
        <Slider
          label="Lebenserwartung"
          value={s.lifeExp}
          min={Math.max(70, s.retireAge + 1)}
          max={100}
          step={1}
          display={`${s.lifeExp} Jahre`}
          onChange={(v) => set('lifeExp', v)}
        />
        <Callout tone={short ? 'warn' : 'info'} title={`${r.years} Jahre sparen, ${r.drawYears} Jahre entnehmen`}>
          <p className="muted">
            {short
              ? 'Kurze Ansparphase: Der Zinseszins hat wenig Zeit, und das Geld muss lange reichen.'
              : 'Jedes Jahr später wirkt doppelt: ein Jahr mehr Zinseszins und ein Jahr weniger Entnahme.'}
          </p>
        </Callout>
      </Group>
      <Group legend="Wunsch">
        <Slider
          label="Zusatzrente im Monat"
          value={s.rentTarget}
          min={500}
          max={6000}
          step={50}
          display={fmt(s.rentTarget)}
          hint="In heutiger Kaufkraft. Die Inflation rechnet die App automatisch dazu."
          onChange={(v) => set('rentTarget', v)}
        />
      </Group>
    </>
  );
}

/* ── Bitcoin ── */
export function PanelBitcoin({ s, set, r }: P) {
  const level = getRenditeLevel(r.btcAvgRate * 100);
  const scenario = s.btcDecay ? null : (SCENARIOS.find((sc) => Math.abs(sc.rate - s.btcRate) < 1e-9)?.id ?? null);
  return (
    <>
      <Group legend="Bestand">
        <NumberField label="Meine BTC-Menge" value={s.btcAmount} min={0} max={100} suffix="BTC" onChange={(v) => set('btcAmount', v)} />
        <Slider
          label="BTC-Preis heute"
          value={s.btcPrice}
          min={30000}
          max={200000}
          step={1000}
          display={fmt(s.btcPrice)}
          onChange={(v) => set('btcPrice', v)}
        />
        <dl className="stats">
          <Stat label="Wert heute" value={fmt(r.btcCurrentValue)} sub={`${r.btcSats.toLocaleString('de-DE')} Satoshi`} />
          <Stat
            label={`Bestand mit ${s.retireAge}`}
            value={fmt(r.btcHoldingFinal)}
            sub={`ohne Sparplan, Ø ${pct(r.btcAvgRate)} p.a.`}
            ink="ink-btc"
          />
        </dl>
      </Group>

      <Group legend="Sparplan">
        <Slider
          label="Monatliche BTC-Sparrate"
          value={s.btcSave}
          min={0}
          max={500}
          step={5}
          display={`${s.btcSave} €`}
          onChange={(v) => set('btcSave', v)}
        />
      </Group>

      <Group legend="Rendite">
        <RadioGroup
          legend="Szenario (VanEck, Langfristannahmen bis 2050)"
          name="scenario"
          value={scenario}
          options={SCENARIOS.map((sc) => ({ value: sc.id, label: sc.label, detail: sc.hint }))}
          onChange={(id) => {
            const sc = SCENARIOS.find((x) => x.id === id);
            if (!sc) return;
            set('btcDecay', false);
            set('btcRate', sc.rate);
          }}
        />
        <Switch
          label="Rendite nimmt ab"
          description="Sinkt gleichmäßig von der Start- zur Endrendite. Realistischer, weil das Wachstum mit der Marktgröße nachlässt."
          checked={s.btcDecay}
          onChange={(v) => set('btcDecay', v)}
        />
        <Slider
          label={s.btcDecay ? 'Startrendite p.a.' : 'Rendite p.a.'}
          value={s.btcRate * 100}
          min={0}
          max={40}
          step={0.5}
          display={pct(s.btcRate)}
          onChange={(v) => set('btcRate', v / 100)}
        />
        {s.btcDecay && (
          <Slider
            label={`Endrendite p.a. (${r.retireYear})`}
            value={s.btcRateEnd * 100}
            min={0}
            max={30}
            step={0.5}
            display={pct(s.btcRateEnd)}
            onChange={(v) => set('btcRateEnd', v / 100)}
          />
        )}
        <Callout tone={level.tone} title={`${level.label}: Ø ${pct(r.btcAvgRate)} p.a.`}>
          <p>{level.context}</p>
          <p className="muted">{level.note}</p>
        </Callout>
      </Group>
    </>
  );
}

/* ── ETF ── */
export function PanelEtf({ s, set }: Omit<P, 'r'>) {
  return (
    <Group legend="Sparplan">
      <Slider
        label="Monatliche ETF-Sparrate"
        value={s.etfSave}
        min={0}
        max={800}
        step={10}
        display={`${s.etfSave} €`}
        onChange={(v) => set('etfSave', v)}
      />
      <Slider
        label="Rendite p.a."
        value={s.etfRate * 100}
        min={4}
        max={12}
        step={0.5}
        display={pct(s.etfRate)}
        hint="Breite Welt-ETFs (MSCI World, FTSE All-World) lagen langfristig bei etwa 7–8 % nominal p.a., mit starken Schwankungen dazwischen."
        onChange={(v) => set('etfRate', v / 100)}
      />
    </Group>
  );
}

/* ── Annahmen ── */
export function PanelAnnahmen({ s, set, r }: P) {
  return (
    <>
      <Group legend="Inflation">
        <Slider
          label="Inflationsrate p.a."
          value={s.inflRate * 100}
          min={0.5}
          max={6}
          step={0.1}
          display={pct(s.inflRate)}
          hint={`1.000 € heute sind ${r.retireYear} noch ${fmt(r.purchasingPower1000)} wert. Deine Wunschrente entspricht dann ${fmt(r.rentTargetNominal)} im Monat.`}
          onChange={(v) => set('inflRate', v / 100)}
        />
      </Group>
      <Group legend="Rentenphase">
        <Slider
          label="Entnahmequote p.a."
          value={s.withdrawRate * 100}
          min={2}
          max={6}
          step={0.1}
          display={pct(s.withdrawRate)}
          hint="Bestimmt, wie viel Kapital für die Wunschrente nötig ist. 4 % heißt: das 25-Fache der Jahresrente."
          onChange={(v) => set('withdrawRate', v / 100)}
        />
        <Slider
          label="Rendite in der Rente p.a."
          value={s.retireReturn * 100}
          min={0}
          max={8}
          step={0.1}
          display={pct(s.retireReturn)}
          hint="Bestimmt, wie lange das Kapital reicht. Eher vorsichtig ansetzen, weil man in der Rente meist risikoärmer anlegt."
          onChange={(v) => set('retireReturn', v / 100)}
        />
      </Group>
    </>
  );
}

/* ── Risiko & Steuern (optionale Zusätze) ── */
export function PanelRisiko({ s, set, r }: P) {
  return (
    <>
      <Group legend="Stresstest">
        <Switch
          label="Bitcoin-Crash simulieren"
          description="Ein Einbruch ohne anschließende Erholung. Zeigt, was im schlechten Fall übrig bleibt."
          checked={s.crashOn}
          onChange={(v) => set('crashOn', v)}
        />
        {s.crashOn && (
          <div className="sub-fields">
            <Slider
              label="Einbruch"
              value={s.crashPct * 100}
              min={30}
              max={90}
              step={5}
              display={`−${Math.round(s.crashPct * 100)} %`}
              onChange={(v) => set('crashPct', v / 100)}
            />
            <Slider
              label="Zeitpunkt"
              value={s.crashYearsBefore}
              min={0}
              max={Math.min(15, r.years)}
              step={1}
              display={s.crashYearsBefore === 0 ? 'zum Rentenbeginn' : `${s.crashYearsBefore} J. vorher (${r.crashYear})`}
              onChange={(v) => set('crashYearsBefore', v)}
            />
          </div>
        )}
      </Group>

      <Group legend="Absicherung">
        <Switch
          label="Vor der Rente BTC in ETF umschichten"
          description="Verkauft BTC schrittweise und legt den Erlös im ETF an. Die BTC-Sparrate fließt in dieser Zeit ebenfalls in den ETF."
          checked={s.glideOn}
          onChange={(v) => set('glideOn', v)}
        />
        {s.glideOn && (
          <div className="sub-fields">
            <Slider
              label="Beginn"
              value={s.glideYears}
              min={1}
              max={Math.max(1, Math.min(20, r.years))}
              step={1}
              display={`${s.glideYears} J. vorher (${r.glideStartYear})`}
              onChange={(v) => set('glideYears', v)}
            />
            <Slider
              label="Umgeschichteter Anteil"
              value={s.glidePct * 100}
              min={10}
              max={100}
              step={5}
              display={`${Math.round(s.glidePct * 100)} %`}
              hint="Am besten zusammen mit dem Crash-Test vergleichen: Ein Einbruch kurz vor Rentenbeginn trifft am härtesten."
              onChange={(v) => set('glidePct', v / 100)}
            />
          </div>
        )}
      </Group>

      <Group legend="Steuern">
        <Switch
          label="Steuern berücksichtigen"
          description={`ETF-Gewinne effektiv ~${pct(ETF_TAX)} (Abgeltungsteuer und Soli, 30 % Teilfreistellung). BTC nach 1 Jahr Haltedauer steuerfrei.`}
          checked={s.taxOn}
          onChange={(v) => set('taxOn', v)}
        />
        {s.taxOn && (
          <dl className="stats">
            <Stat label="ETF-Einzahlungen" value={fmt(r.etfContributions)} />
            <Stat label="Steuer auf ETF-Gewinne" value={fmt(r.latentTax)} ink="ink-danger" />
          </dl>
        )}
        <p className="hint">
          Vereinfacht: Die Steuer wird so berechnet, als würde der ETF zum Rentenbeginn komplett verkauft. Sparerpauschbetrag,
          Kirchensteuer und Vorabpauschale fehlen. Keine Steuerberatung.
        </p>
      </Group>
    </>
  );
}

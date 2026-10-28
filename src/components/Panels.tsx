import {
  AV_MAX_MONTHLY,
  AV_MIN_YEARLY,
  AV_START_YEAR,
  AV_YOUNG_BONUS,
  BBG_RV,
  DURCHSCHNITTSENTGELT,
  ETF_TAX,
  REGELALTER,
  RENTENWERT,
  RETIRE_MAX,
  SCENARIOS,
  avGrant,
  fmt,
  fmtPoints,
  getRenditeLevel,
  maxWorkYears,
  pct,
  retireMin,
} from '../calc';
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
      <GesetzlicheRente s={s} set={set} r={r} />
    </>
  );
}

function GesetzlicheRente({ s, set, r }: P) {
  const average = `Wer genau den Durchschnitt verdient (2026: ${fmt(DURCHSCHNITTSENTGELT / 12)}), bekommt 1 Punkt pro Jahr. Mehr als ${fmt(BBG_RV / 12)} zählt nicht.`;
  return (
    <Group legend="Gesetzliche Rente">
      <RadioGroup
        legend="Meine Rentenpunkte"
        name="points"
        value={s.pointsKnown ? 'known' : 'estimate'}
        options={[
          { value: 'known', label: 'Weiß ich', detail: 'aus der Renteninformation' },
          { value: 'estimate', label: 'Schätzen', detail: 'aus Jahren und Gehalt' },
        ]}
        onChange={(v) => {
          // Beim ersten Wechsel die Schätzung übernehmen, damit die Zahlen nicht springen
          if (v === 'known' && s.pensionPoints === 0) set('pensionPoints', Math.round(r.pointsToday * 100) / 100);
          set('pointsKnown', v === 'known');
        }}
      />
      {s.pointsKnown ? (
        <NumberField
          label="Rentenpunkte heute"
          value={s.pensionPoints}
          min={0}
          max={150}
          decimals={4}
          suffix="Punkte"
          hint="Stehen als „Entgeltpunkte“ in der Renteninformation, die die Deutsche Rentenversicherung jedes Jahr verschickt."
          onChange={(v) => set('pensionPoints', v)}
        />
      ) : (
        <NumberField
          label="Bisher gearbeitet"
          value={s.workYears}
          min={0}
          max={maxWorkYears(s)}
          decimals={0}
          suffix="Jahre"
          hint="Jahre mit Beiträgen zur Rentenversicherung, zum Beispiel in einer Anstellung oder Ausbildung."
          onChange={(v) => set('workYears', v)}
        />
      )}
      <NumberField
        label="Bruttogehalt im Monat"
        value={s.grossSalary}
        min={0}
        max={20000}
        decimals={0}
        suffix="€"
        hint={
          s.pointsKnown
            ? `Damit rechnet die App die Punkte bis zum Renteneintritt hoch. ${average}`
            : `Ungefährer Schnitt über die Jahre. Damit rechnet die App auch bis zum Renteneintritt weiter. ${average}`
        }
        onChange={(v) => set('grossSalary', v)}
      />
      <dl className="stats">
        {!s.pointsKnown && <Stat label="Rentenpunkte heute" value={fmtPoints(r.pointsToday)} sub="geschätzt" />}
        <Stat label={`Punkte mit ${s.retireAge}`} value={fmtPoints(r.pointsAtRetire)} sub={`+${fmtPoints(r.pointsPerYear, 2)} pro Jahr`} />
        <Stat label={`Gesetzliche Rente ab ${REGELALTER}`} value={fmt(r.statePensionToday)} sub="brutto, heutige Kaufkraft" />
      </dl>
      <p className="hint">
        Vereinfacht: Rentenpunkte mal aktueller Rentenwert ({RENTENWERT.toLocaleString('de-DE', { minimumFractionDigits: 2 })} € seit
        Juli 2026), ohne Abschläge ab {REGELALTER}. Annahmen: Du verdienst bis {s.retireAge} im Verhältnis zum Durchschnitt so viel
        wie heute und zahlst danach nicht mehr ein, der Rentenwert steigt wie die Inflation. Von der Bruttorente gehen noch Kranken-
        und Pflegeversicherung und ggf. Steuern ab.
      </p>
    </Group>
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
export function PanelEtf({ s, set, r }: P) {
  return (
    <>
      <EtfSparplan s={s} set={set} />
      <Altersvorsorgedepot s={s} set={set} r={r} />
    </>
  );
}

function EtfSparplan({ s, set }: Omit<P, 'r'>) {
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

function Altersvorsorgedepot({ s, set, r }: P) {
  const yearly = s.avSave * 12;
  const grant = avGrant(yearly);
  const max = Math.min(AV_MAX_MONTHLY, s.etfSave);
  const locked = r.avPayoutAge - s.retireAge;
  return (
    <Group legend="Altersvorsorgedepot">
      <Switch
        label="Altersvorsorgedepot nutzen"
        description={`Staatlich gefördertes Depot ab ${AV_START_YEAR}. Ein Teil der ETF-Rate fließt hinein und bekommt Zulagen, ist aber bis ${r.avPayoutAge} gesperrt.`}
        checked={s.avOn}
        onChange={(v) => set('avOn', v)}
      />
      {s.avOn && (
        <div className="sub-fields">
          <Slider
            label="Davon ins Altersvorsorgedepot"
            value={s.avSave}
            min={0}
            max={max}
            step={5}
            display={`${s.avSave} € im Monat`}
            hint={
              max < AV_MIN_YEARLY / 12
                ? `Erhöhe zuerst die ETF-Sparrate: Zulagen gibt es ab ${AV_MIN_YEARLY / 12} € im Monat.`
                : `Gefördert werden ${AV_MIN_YEARLY / 12} bis ${AV_MAX_MONTHLY} € im Monat. Der Rest der ETF-Rate (${s.etfSave - s.avSave} €) bleibt im normalen ETF-Depot.`
            }
            onChange={(v) => set('avSave', v)}
          />
          <dl className="stats">
            <Stat
              label="Zulage pro Jahr"
              value={fmt(grant)}
              sub={grant > 0 ? `+${pct(grant / yearly, 0)} auf ${fmt(yearly)} Einzahlung` : `erst ab ${fmt(AV_MIN_YEARLY)} im Jahr`}
              ink="ink-etf"
            />
            <Stat
              label={`Depot mit ${r.avPayoutAge}`}
              value={fmt(r.avAtPayout)}
              sub={`eingezahlt ${fmt(r.avContributions)}, Zulagen ${fmt(r.avGrants)}`}
            />
            <Stat
              label={`Auszahlung ab ${r.avPayoutAge}`}
              value={fmt(r.avPayout)}
              sub={`im Monat bis ${r.avPlanEndAge}, ${s.taxOn ? 'nach' : 'vor'} Steuern`}
            />
          </dl>
          {locked > 0 && (
            <Callout tone="warn" title={`${locked} Jahre ohne Zugriff`}>
              <p className="muted">
                Zwischen {s.retireAge} und {r.avPayoutAge} kommst du nicht an dieses Geld. Es zählt deshalb nicht zur Zusatzrente ab{' '}
                {s.retireAge}, sondern kommt ab {r.avPayoutAge} als eigene Auszahlung dazu.
              </p>
            </Callout>
          )}
          <p className="hint">
            Vereinfacht: gleiche Rendite wie beim ETF (im Standarddepot sind die Kosten auf 1 % pro Jahr gedeckelt). Grundzulage 50 Cent
            je Euro bis 360 € und 25 Cent je Euro bis 1.800 € im Jahr, einmalig {AV_YOUNG_BONUS} € für alle unter 25. Kinderzulage und
            Steuervorteile über die Zulage hinaus sind nicht eingerechnet. Auszahlung frühestens mit {r.avPayoutAge} (früher nur bei
            vorgezogener gesetzlicher Altersrente) als Auszahlplan bis {r.avPlanEndAge}, der mit der Inflation steigt. Wer vorher an
            das Geld will, muss Zulagen und Steuervorteile zurückzahlen. Die Auszahlungen werden mit dem persönlichen Steuersatz
            versteuert.
          </p>
        </div>
      )}
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
        {s.taxOn && s.avOn && (
          <Slider
            label="Steuersatz auf das Altersvorsorgedepot"
            value={s.avTaxRate * 100}
            min={0}
            max={45}
            step={1}
            display={pct(s.avTaxRate, 0)}
            hint="Persönlicher Steuersatz in der Rente. Die Auszahlungen sind voll steuerpflichtig, dafür waren Einzahlungen und Erträge vorher steuerfrei."
            onChange={(v) => set('avTaxRate', v / 100)}
          />
        )}
        <p className="hint">
          Vereinfacht: Die Steuer wird so berechnet, als würde der ETF zum Rentenbeginn komplett verkauft. Sparerpauschbetrag,
          Kirchensteuer und Vorabpauschale fehlen. Keine Steuerberatung.
        </p>
      </Group>
    </>
  );
}

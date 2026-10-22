import { fmt, pct } from '../calc';
import type { PlannerResult, PlannerState, Setter } from '../types';
import { Callout, RadioGroup, Stat } from './Fields';

type Status = { tone: 'ok' | 'warn' | 'bad'; bar: string; label: string };

export function status(s: PlannerState, r: PlannerResult): Status {
  const share = Math.round(r.fundedPct * 100);
  const lasts = r.depletionAge === null ? `reicht bis ${s.lifeExp}+` : `reicht bis ${Math.floor(r.depletionAge)}`;
  const label = `${share.toLocaleString('de-DE')} % · ${lasts}`;
  if (r.fundedPct >= 1 && r.depletionAge === null) return { tone: 'ok', bar: 'var(--etf)', label };
  if (r.fundedPct >= 0.6) return { tone: 'warn', bar: 'var(--warn-ink)', label };
  return { tone: 'bad', bar: 'var(--danger)', label };
}

/** Feste Zeile oben: die eine Antwort, die beim Verstellen der Regler sichtbar bleibt. */
export function Summary({ s, r }: { s: PlannerState; r: PlannerResult }) {
  const st = status(s, r);
  const width = Math.max(0, Math.min(100, r.fundedPct * 100));
  return (
    <section className="summary" aria-labelledby="summary-label">
      <h2 className="summary-label" id="summary-label">
        Zusatzrente ab {s.retireAge} · {s.showReal ? 'heutige Kaufkraft' : `nominal ${r.retireYear}`}
      </h2>
      <div className="summary-row">
        <p className="summary-figure">
          <strong>{fmt(r.achievable)}</strong> von {fmt(r.rentTargetDisplay)} im Monat
        </p>
        <span className={`pill tone-${st.tone}`}>{st.label}</span>
      </div>
      <div className="bar" aria-hidden="true">
        <span style={{ width: `${width}%`, ['--bar-color' as string]: st.bar }} />
      </div>
    </section>
  );
}

/** Text für die Screenreader-Ansage, wenn sich das Ergebnis ändert. */
export function summaryText(s: PlannerState, r: PlannerResult): string {
  const share = Math.round(r.fundedPct * 100);
  const lasts =
    r.depletionAge === null
      ? `Das Geld reicht über ${s.lifeExp} hinaus.`
      : `Das Geld ist mit ${Math.floor(r.depletionAge)} aufgebraucht.`;
  return `Zusatzrente ab ${s.retireAge}: ${fmt(r.achievable)} von ${fmt(r.rentTargetDisplay)} im Monat, ${share} Prozent des Ziels. ${lasts}`;
}

export function Results({ s, set, r }: { s: PlannerState; set: Setter; r: PlannerResult }) {
  const reached = r.gap <= 0;
  const ok = r.depletionAge === null;
  return (
    <section className="section" aria-labelledby="results-title">
      <div className="section-head">
        <h2 id="results-title">Ergebnis mit {s.retireAge}</h2>
        <RadioGroup
          legend="Beträge anzeigen"
          legendHidden
          name="unit"
          value={s.showReal ? 'real' : 'nominal'}
          options={[
            { value: 'real', label: 'Heutige Kaufkraft' },
            { value: 'nominal', label: 'Nominal' },
          ]}
          onChange={(v) => set('showReal', v === 'real')}
        />
      </div>

      {reached ? (
        <Callout tone="ok" title={`Ziel erreicht, ${fmt(-r.gap)} Puffer`}>
          {!ok && (
            <p>
              Achtung: Mit {pct(s.retireReturn)} Rendite in der Rente ist das Geld trotzdem mit {Math.floor(r.depletionAge ?? 0)}{' '}
              aufgebraucht.
            </p>
          )}
        </Callout>
      ) : (
        <Callout tone={r.fundedPct >= 0.6 ? 'warn' : 'bad'} title={`Es fehlen ${fmt(r.gap)}`}>
          <p>
            Um die Lücke zu schließen, bräuchtest du zusätzlich <strong>{fmt(r.neededEtfRate)} im Monat</strong> im ETF-Sparplan
            (vor Steuern), oder einen späteren Renteneintritt.
          </p>
        </Callout>
      )}

      <dl className="stats">
        <Stat label={`BTC mit ${s.retireAge}`} value={fmt(r.btcFinal)} ink="ink-btc" />
        <Stat label={`ETF mit ${s.retireAge}`} value={fmt(r.etfFinal)} ink="ink-etf" />
        <Stat
          label={s.taxOn ? 'Vermögen nach Steuern' : 'Vermögen gesamt'}
          value={fmt(s.taxOn ? r.capitalNet : r.total)}
          sub={s.taxOn ? `vor Steuern ${fmt(r.total)}` : undefined}
          ink="ink-accent"
        />
        <Stat label="Nötiges Kapital" value={fmt(r.neededCapital)} sub={`bei ${pct(s.withdrawRate)} Entnahme`} />
        <Stat
          label="Geld reicht bis"
          value={ok ? `${s.lifeExp}+ Jahre` : `${Math.floor(r.depletionAge ?? 0)} Jahre`}
          sub={ok ? 'über die Lebenserwartung hinaus' : `Lebenserwartung ${s.lifeExp}`}
          ink={ok ? 'ink-ok' : 'ink-danger'}
        />
        <Stat
          label={`Wunschrente ${r.retireYear}`}
          value={`${fmt(r.rentTargetNominal)}`}
          sub={`nominal, entspricht ${fmt(s.rentTarget)} heute`}
        />
      </dl>
    </section>
  );
}

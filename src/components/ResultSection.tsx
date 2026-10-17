import type { ReactNode } from 'react';
import { fmt, pct } from '../calc';
import { C, TONES } from '../theme';
import type { PlannerResult, PlannerState } from '../types';
import { MetricCard } from './MetricCard';

export function ResultSection({ s, r }: { s: PlannerState; r: PlannerResult }) {
  const reached = r.gap <= 0;
  const ok = r.depletionAge === null;
  const realHint = s.showReal ? ' (heutige Kaufkraft)' : '';
  const grid = { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10 } as const;

  return (
    <section style={{ marginBottom: 24 }} aria-label="Ergebnis">
      <div style={{ ...grid, marginBottom: 12 }}>
        <MetricCard label={`BTC mit ${s.retireAge}`} value={fmt(r.btcFinal)} color={C.btc} />
        <MetricCard label={`ETF mit ${s.retireAge}`} value={fmt(r.etfFinal)} color={C.etf} />
        <MetricCard
          label={s.taxOn ? 'Gesamtvermögen nach Steuern' : 'Gesamtvermögen'}
          value={fmt(s.taxOn ? r.capitalNet : r.total)}
          color={C.blue}
          sub={s.taxOn ? `vor Steuern ${fmt(r.total)}` : undefined}
        />
        <MetricCard label={`Kapital nötig${realHint}`} value={fmt(r.neededCapital)} />
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 12 }}>
        <Badge tone={reached ? 'green' : 'red'} strong>
          {reached ? `Ziel erreichbar – Überschuss: ${fmt(-r.gap)}` : `Lücke: ${fmt(r.gap)} fehlen`}
        </Badge>
        <Badge tone="amber">
          Ziel mit {pct(s.inflRate)} Inflation im Jahr {r.retireYear}: {fmt(r.rentTargetNominal)} /Mo
        </Badge>
      </div>

      <div style={grid}>
        <MetricCard label="Fehlbetrag" value={reached ? '0 €' : fmt(r.gap)} color={reached ? C.etf : C.red} />
        <MetricCard
          label="Nötige ETF-Sparrate (Lücke)"
          value={reached ? '–' : `${fmt(r.neededEtfRate)} /Mo`}
          sub={reached ? 'Ziel bereits erreicht' : 'zusätzlich, vor Steuern'}
        />
        <MetricCard label={`Erreichbare Rente${s.showReal ? ' (heute)' : ' (nominal)'}`} value={`${fmt(r.achievable)} /Mo`} />
        <MetricCard
          label="Kapital hält bis Alter"
          value={ok ? `${s.lifeExp}+` : `${Math.floor(r.depletionAge ?? 0)}`}
          color={ok ? C.etf : C.red}
          sub={ok ? 'reicht bis Lebenserwartung' : 'vor Lebenserwartung erschöpft'}
        />
      </div>
    </section>
  );
}

function Badge({ tone, strong, children }: { tone: 'green' | 'red' | 'amber'; strong?: boolean; children: ReactNode }) {
  const t = TONES[tone];
  return (
    <span
      style={{
        padding: '7px 14px',
        borderRadius: 999,
        fontSize: 13,
        fontWeight: strong ? 700 : 600,
        background: t.bg,
        color: t.text,
        border: `1px solid ${t.color}44`,
        lineHeight: 1.4,
      }}
    >
      {children}
    </span>
  );
}

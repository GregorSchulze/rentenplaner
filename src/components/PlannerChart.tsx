import { useEffect } from 'react';
import {
  CartesianGrid,
  Line,
  LineChart,
  ReferenceArea,
  ReferenceLine,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { fmtShort } from '../calc';
import { C } from '../theme';
import type { PlannerResult, YearDataPoint } from '../types';

interface Props {
  r: PlannerResult;
  retireAge: number;
  hovered: YearDataPoint | null;
  onHover: (p: YearDataPoint | null) => void;
}

/** Meldet den aktiven Datenpunkt nach oben – die Info erscheint als Leiste unter dem Chart statt als Popup. */
function HoverReporter({
  active,
  payload,
  onHover,
}: {
  active?: boolean;
  payload?: ReadonlyArray<{ payload?: YearDataPoint }>;
  onHover: (p: YearDataPoint | null) => void;
}) {
  const point = active && payload && payload.length ? (payload[0].payload ?? null) : null;
  useEffect(() => {
    onHover(point);
  }, [point, onHover]);
  return null;
}

export function PlannerChart({ r, retireAge, hovered, onHover }: Props) {
  return (
    <div>
      <div style={{ width: '100%', height: 300 }}>
        <ResponsiveContainer>
          <LineChart data={r.points} margin={{ top: 10, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid stroke={C.border} strokeDasharray="3 3" vertical={false} />
            {r.glideStartYear !== null && r.glideStartYear < r.retireYear && (
              <ReferenceArea x1={r.glideStartYear} x2={r.retireYear} fill={C.etf} fillOpacity={0.07} stroke="none" />
            )}
            <XAxis
              dataKey="year"
              tick={{ fontSize: 11, fill: C.sub }}
              tickLine={false}
              axisLine={{ stroke: C.border }}
              interval="preserveStartEnd"
              minTickGap={36}
            />
            <YAxis tickFormatter={(v: number) => fmtShort(v)} tick={{ fontSize: 11, fill: C.sub }} tickLine={false} axisLine={false} width={60} />
            <Tooltip
              content={(props) => (
                <HoverReporter
                  active={props.active}
                  payload={props.payload as ReadonlyArray<{ payload?: YearDataPoint }> | undefined}
                  onHover={onHover}
                />
              )}
              cursor={{ stroke: C.sub, strokeDasharray: '3 3' }}
            />
            <ReferenceLine
              x={r.retireYear}
              stroke={C.sub}
              strokeDasharray="4 4"
              label={{ value: `Rente (${retireAge})`, position: 'insideTopRight', fontSize: 11, fill: C.sub }}
            />
            {r.crashYear !== null && r.crashYear !== r.retireYear && (
              <ReferenceLine x={r.crashYear} stroke={C.red} strokeDasharray="2 3" label={{ value: 'Crash', position: 'insideBottomLeft', fontSize: 11, fill: C.red }} />
            )}
            <Line type="monotone" dataKey="btc" stroke={C.btc} strokeWidth={2} dot={false} connectNulls={false} isAnimationActive={false} />
            <Line type="monotone" dataKey="etf" stroke={C.etf} strokeWidth={2} dot={false} connectNulls={false} isAnimationActive={false} />
            <Line type="monotone" dataKey="total" stroke={C.blue} strokeWidth={2.5} dot={false} connectNulls={false} isAnimationActive={false} />
            <Line type="monotone" dataKey="rest" stroke={C.rest} strokeWidth={2} dot={false} connectNulls={false} isAnimationActive={false} />
            <Line
              type="monotone"
              dataKey="target"
              stroke={C.target}
              strokeWidth={1.5}
              strokeDasharray="6 4"
              dot={false}
              connectNulls
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div
        style={{
          marginTop: 8,
          padding: '10px 14px',
          background: C.card,
          border: `1px solid ${C.border}`,
          borderRadius: 10,
          fontSize: 12.5,
          minHeight: 44,
          display: 'flex',
          flexWrap: 'wrap',
          gap: '6px 16px',
          alignItems: 'center',
          color: C.sub,
        }}
      >
        {hovered ? <HoverInfo p={hovered} /> : <span>Auf das Chart tippen oder darüberfahren, um Details pro Jahr zu sehen.</span>}
      </div>

      <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', marginTop: 10, fontSize: 12, color: C.sub }}>
        <LegendItem color={C.btc} label="BTC" />
        <LegendItem color={C.etf} label="ETF" />
        <LegendItem color={C.blue} label="Gesamt" />
        <LegendItem color={C.rest} label="Restkapital (Entnahme)" />
        <LegendItem color={C.target} label="Zielkapital" dashed />
      </div>
    </div>
  );
}

function HoverInfo({ p }: { p: YearDataPoint }) {
  const capital = p.phase === 'entnahme' ? p.rest : p.total;
  const dist = capital !== null ? capital - p.target : null;
  return (
    <>
      <strong style={{ color: C.text }}>
        {p.year} · Alter {p.age}
      </strong>
      {p.phase === 'anspar' ? (
        <>
          <span>
            BTC <strong style={{ color: C.btc }}>{fmtShort(p.btc)}</strong>
          </span>
          <span>
            ETF <strong style={{ color: C.etf }}>{fmtShort(p.etf)}</strong>
          </span>
          <span>
            Gesamt <strong style={{ color: C.blue }}>{fmtShort(p.total)}</strong>
          </span>
        </>
      ) : (
        <span>
          Restkapital <strong style={{ color: C.rest }}>{fmtShort(p.rest)}</strong>
        </span>
      )}
      <span>
        Mögl. Rente <strong style={{ color: C.text }}>{fmtShort(p.possibleRent)}/Mo</strong>
      </span>
      {dist !== null && (
        <span>
          Zum Ziel{' '}
          <strong style={{ color: dist >= 0 ? C.etf : C.red }}>
            {dist >= 0 ? '+' : ''}
            {fmtShort(dist)}
          </strong>
        </span>
      )}
    </>
  );
}

function LegendItem({ color, label, dashed }: { color: string; label: string; dashed?: boolean }) {
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}>
      <span style={{ width: 18, height: 0, borderTop: `${dashed ? '2px dashed' : '3px solid'} ${color}`, display: 'inline-block' }} />
      {label}
    </span>
  );
}

import { useEffect, useId } from 'react';
import { CartesianGrid, Line, LineChart, ReferenceArea, ReferenceLine, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { fmt, fmtShort } from '../calc';
import { useChartPalette } from '../theme';
import type { PlannerResult, PlannerState, YearDataPoint } from '../types';

interface Props {
  s: PlannerState;
  r: PlannerResult;
  hoveredYear: number | null;
  onHover: (year: number | null) => void;
}

/** Meldet das aktive Jahr nach oben. Die Werte erscheinen als Leiste unter dem Chart statt als Popup. */
function HoverReporter({ active, year, onHover }: { active?: boolean; year: number | null; onHover: (y: number | null) => void }) {
  const y = active ? year : null;
  useEffect(() => {
    onHover(y);
  }, [y, onHover]);
  return null;
}

export function PlannerChart({ s, r, hoveredYear, onHover }: Props) {
  const P = useChartPalette();
  const capId = useId();
  // Immer aus den aktuellen Daten lesen, damit die Leiste nach Änderungen nicht veraltet
  const hovered = hoveredYear === null ? null : (r.points.find((p) => p.year === hoveredYear) ?? null);
  const unit = s.showReal ? 'in heutiger Kaufkraft' : 'nominal';
  const lastYear = r.points[r.points.length - 1]?.year ?? r.retireYear;
  const reach =
    r.depletionAge === null ? `reicht das Geld über das Alter ${s.lifeExp} hinaus` : `ist das Geld mit ${Math.floor(r.depletionAge)} aufgebraucht`;

  return (
    <figure className="section" aria-labelledby={`${capId}-title`}>
      <figcaption className="visually-hidden" id={`${capId}-title`}>
        Verlauf {r.startYear} bis {lastYear}, {unit}: Das Vermögen wächst bis {r.retireYear} auf {fmt(r.capitalNet)}, nötig wären{' '}
        {fmt(r.neededCapital)}. Danach wird entnommen, und es {reach}.
      </figcaption>

      <div className="chart">
        <ResponsiveContainer>
          <LineChart data={r.points} margin={{ top: 10, right: 8, bottom: 0, left: 0 }}>
            <CartesianGrid stroke={P['--border']} strokeDasharray="3 3" vertical={false} />
            {r.glideStartYear !== null && r.glideStartYear < r.retireYear && (
              <ReferenceArea x1={r.glideStartYear} x2={r.retireYear} fill={P['--etf']} fillOpacity={0.08} stroke="none" />
            )}
            <XAxis
              dataKey="year"
              tick={{ fontSize: 12, fill: P['--muted'] }}
              tickLine={false}
              axisLine={{ stroke: P['--border'] }}
              interval="preserveStartEnd"
              minTickGap={36}
            />
            <YAxis
              tickFormatter={(v: number) => fmtShort(v)}
              tick={{ fontSize: 12, fill: P['--muted'] }}
              tickLine={false}
              axisLine={false}
              width={62}
            />
            <Tooltip
              content={(props) => (
                <HoverReporter
                  active={props.active}
                  year={(props.payload?.[0]?.payload as YearDataPoint | undefined)?.year ?? null}
                  onHover={onHover}
                />
              )}
              cursor={{ stroke: P['--muted'], strokeDasharray: '3 3' }}
            />
            <ReferenceLine
              x={r.retireYear}
              stroke={P['--muted']}
              strokeDasharray="4 4"
              label={{ value: `Rente (${s.retireAge})`, position: 'insideTopRight', fontSize: 12, fill: P['--muted'] }}
            />
            {r.crashYear !== null && r.crashYear !== r.retireYear && (
              <ReferenceLine
                x={r.crashYear}
                stroke={P['--danger']}
                strokeDasharray="2 3"
                label={{ value: 'Crash', position: 'insideBottomLeft', fontSize: 12, fill: P['--danger'] }}
              />
            )}
            <Line type="monotone" dataKey="btc" name="BTC" stroke={P['--btc']} strokeWidth={2} dot={false} connectNulls={false} isAnimationActive={false} />
            <Line type="monotone" dataKey="etf" name="ETF" stroke={P['--etf']} strokeWidth={2} dot={false} connectNulls={false} isAnimationActive={false} />
            <Line type="monotone" dataKey="total" name="Gesamt" stroke={P['--accent']} strokeWidth={3} dot={false} connectNulls={false} isAnimationActive={false} />
            <Line type="monotone" dataKey="rest" name="Restkapital" stroke={P['--rest']} strokeWidth={2} dot={false} connectNulls={false} isAnimationActive={false} />
            <Line
              type="monotone"
              dataKey="target"
              name="Zielkapital"
              stroke={P['--target']}
              strokeWidth={1.5}
              strokeDasharray="6 4"
              dot={false}
              connectNulls
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>

      <div className="readout" aria-live="polite" aria-atomic="true">
        {hovered ? <Readout p={hovered} /> : <span>Auf das Chart tippen oder darüberfahren. Mit der Tastatur: Chart fokussieren, dann Pfeiltasten.</span>}
      </div>

      <ul className="legend" aria-label="Legende">
        <LegendItem color="var(--btc)" label="BTC" />
        <LegendItem color="var(--etf)" label="ETF" />
        <LegendItem color="var(--accent)" label="Gesamt" />
        <LegendItem color="var(--rest)" label="Restkapital in der Rente" />
        <LegendItem color="var(--target)" label="Zielkapital" dashed />
      </ul>

      <details className="table-toggle">
        <summary>Werte als Tabelle</summary>
        <div className="table-wrap" tabIndex={0} role="region" aria-label="Werte pro Jahr">
          <table>
            <caption>Werte pro Jahr, {unit}</caption>
            <thead>
              <tr>
                <th scope="col">Jahr</th>
                <th scope="col">Alter</th>
                <th scope="col">BTC</th>
                <th scope="col">ETF</th>
                <th scope="col">Vermögen</th>
                <th scope="col">Zielkapital</th>
              </tr>
            </thead>
            <tbody>
              {r.points.map((p) => (
                <tr key={p.year} className={p.year === r.retireYear ? 'retire' : undefined}>
                  <th scope="row">{p.year}</th>
                  <td>{p.age}</td>
                  <td>{p.btc === null ? '–' : fmt(p.btc)}</td>
                  <td>{p.etf === null ? '–' : fmt(p.etf)}</td>
                  <td>{fmt(p.phase === 'entnahme' ? p.rest : p.year === r.retireYear ? p.rest : p.total)}</td>
                  <td>{fmt(p.target)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </details>
    </figure>
  );
}

function Readout({ p }: { p: YearDataPoint }) {
  const capital = p.phase === 'entnahme' ? p.rest : p.total;
  const dist = capital !== null ? capital - p.target : null;
  return (
    <>
      <strong className="year">
        {p.year} · Alter {p.age}
      </strong>
      {p.phase === 'anspar' ? (
        <>
          <span>
            BTC <strong className="ink-btc">{fmtShort(p.btc)}</strong>
          </span>
          <span>
            ETF <strong className="ink-etf">{fmtShort(p.etf)}</strong>
          </span>
          <span>
            Gesamt <strong className="ink-accent">{fmtShort(p.total)}</strong>
          </span>
        </>
      ) : (
        <span>
          Restkapital <strong className="ink-rest">{fmtShort(p.rest)}</strong>
        </span>
      )}
      {dist !== null && (
        <span>
          Zum Ziel{' '}
          <strong className={dist >= 0 ? 'ink-ok' : 'ink-danger'}>
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
    <li>
      <span className={`legend-swatch${dashed ? ' dashed' : ''}`} style={{ color }} aria-hidden="true" />
      {label}
    </li>
  );
}

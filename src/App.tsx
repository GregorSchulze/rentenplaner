import { useCallback, useEffect, useMemo, useState } from 'react';
import { DEFAULT_STATE, SAVINGS_BUDGET, applyChange, calculate, sanitizeState } from './calc';
import { PlannerChart } from './components/PlannerChart';
import { ResultSection } from './components/ResultSection';
import { TabBestand } from './components/TabBestand';
import { TabBtcSparplan } from './components/TabBtcSparplan';
import { TabEntnahme } from './components/TabEntnahme';
import { TabEtfSparplan } from './components/TabEtfSparplan';
import { TabInflation } from './components/TabInflation';
import { TabRisiko } from './components/TabRisiko';
import { TabZiel } from './components/TabZiel';
import { Segmented } from './components/Toggle';
import { C } from './theme';
import type { PlannerState, Setter, TabId, YearDataPoint } from './types';

const STORAGE_KEY = 'rentenplaner.state.v2';

const TABS: { id: TabId; label: string }[] = [
  { id: 'bestand', label: 'Mein BTC' },
  { id: 'btcplan', label: 'BTC-Sparplan' },
  { id: 'etfplan', label: 'ETF-Sparplan' },
  { id: 'inflation', label: 'Inflation' },
  { id: 'entnahme', label: 'Entnahme' },
  { id: 'risiko', label: 'Risiko & Steuern' },
  { id: 'ziel', label: 'Ziel & Renteneintritt' },
];

function loadState(): PlannerState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return sanitizeState(JSON.parse(raw));
  } catch {
    /* Speicher nicht verfügbar – Standardwerte nutzen */
  }
  return DEFAULT_STATE;
}

export default function App() {
  const [state, setState] = useState<PlannerState>(loadState);
  const [activeTab, setActiveTab] = useState<TabId>('bestand');
  const [hovered, setHovered] = useState<YearDataPoint | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignorieren */
    }
  }, [state]);

  const set: Setter = useCallback((key, value) => setState((prev) => applyChange(prev, key, value)), []);
  const result = useMemo(() => calculate(state), [state]);
  const onHover = useCallback((p: YearDataPoint | null) => setHovered(p), []);

  const totalSave = state.btcSave + state.etfSave;
  const overBudget = totalSave > SAVINGS_BUDGET;

  return (
    <main className="app">
      <header style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 12, marginBottom: 14 }}>
        <div style={{ minWidth: 0 }}>
          <h1 style={{ fontSize: 26, fontWeight: 800, margin: '0 0 2px', letterSpacing: '-0.02em' }}>Rentenplaner</h1>
          <p style={{ fontSize: 13, color: C.sub, margin: 0, lineHeight: 1.5 }}>
            Ansparphase {result.startYear}–{result.retireYear} (Alter {state.startAge}–{state.retireAge}) · Sparrate{' '}
            <strong style={{ color: overBudget ? C.red : C.text }}>{totalSave} €/Mo</strong>
            {overBudget && <span style={{ color: C.red }}> – über deinem Budget von {SAVINGS_BUDGET} €</span>}
          </p>
        </div>
        <button
          type="button"
          onClick={() => {
            if (window.confirm('Alle Eingaben auf die Standardwerte zurücksetzen?')) setState(DEFAULT_STATE);
          }}
          style={{
            flexShrink: 0,
            padding: '7px 11px',
            fontSize: 12.5,
            color: C.sub,
            background: C.card,
            border: `1px solid ${C.border}`,
            borderRadius: 8,
            cursor: 'pointer',
            font: 'inherit',
          }}
        >
          Zurücksetzen
        </button>
      </header>

      <div style={{ marginBottom: 16, maxWidth: 380 }}>
        <Segmented
          ariaLabel="Anzeige der Beträge"
          value={state.showReal ? 'real' : 'nominal'}
          options={[
            { value: 'nominal', label: 'Nominal' },
            { value: 'real', label: 'Heutige Kaufkraft' },
          ]}
          onChange={(v) => set('showReal', v === 'real')}
        />
      </div>

      <nav className="tabbar" role="tablist" aria-label="Bereiche">
        {TABS.map((t) => {
          const active = activeTab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => setActiveTab(t.id)}
              style={{
                padding: '10px 12px',
                fontSize: 13.5,
                fontWeight: active ? 700 : 500,
                color: active ? C.blue : C.sub,
                background: 'none',
                border: 'none',
                borderBottom: active ? `2px solid ${C.blue}` : '2px solid transparent',
                cursor: 'pointer',
                whiteSpace: 'nowrap',
                font: 'inherit',
              }}
            >
              {t.label}
            </button>
          );
        })}
      </nav>

      <section role="tabpanel" style={{ marginBottom: 24 }}>
        {activeTab === 'bestand' && <TabBestand s={state} set={set} r={result} />}
        {activeTab === 'btcplan' && <TabBtcSparplan s={state} set={set} r={result} />}
        {activeTab === 'etfplan' && <TabEtfSparplan s={state} set={set} />}
        {activeTab === 'inflation' && <TabInflation s={state} set={set} r={result} />}
        {activeTab === 'entnahme' && <TabEntnahme s={state} set={set} r={result} />}
        {activeTab === 'risiko' && <TabRisiko s={state} set={set} r={result} />}
        {activeTab === 'ziel' && <TabZiel s={state} set={set} r={result} />}
      </section>

      <ResultSection s={state} r={result} />
      <PlannerChart r={result} retireAge={state.retireAge} hovered={hovered} onHover={onHover} />

      <p style={{ fontSize: 11.5, color: C.sub, marginTop: 22, lineHeight: 1.6 }}>
        Modellrechnung mit vereinfachten, gleichmäßigen Renditen. Reale Verläufe schwanken stark – bei Bitcoin sind
        zwischenzeitliche Einbrüche von 70–80 % historisch normal. Deine Eingaben werden nur lokal auf diesem Gerät gespeichert.
        Keine Anlage- oder Steuerberatung.
      </p>
    </main>
  );
}

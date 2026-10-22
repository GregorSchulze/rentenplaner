import { useCallback, useEffect, useMemo, useRef, useState, type KeyboardEvent } from 'react';
import { DEFAULT_STATE, SAVINGS_BUDGET, applyChange, calculate, sanitizeState } from './calc';
import { PanelAnnahmen, PanelBitcoin, PanelEtf, PanelRisiko, PanelZiel } from './components/Panels';
import { PlannerChart } from './components/PlannerChart';
import { Results, Summary, summaryText } from './components/Results';
import type { PlannerState, Setter, TabId } from './types';

const STORAGE_KEY = 'rentenplaner.state.v2';

const TABS: { id: TabId; label: string }[] = [
  { id: 'ziel', label: 'Ziel' },
  { id: 'bitcoin', label: 'Bitcoin' },
  { id: 'etf', label: 'ETF' },
  { id: 'annahmen', label: 'Annahmen' },
  { id: 'risiko', label: 'Risiko' },
];

function loadState(): PlannerState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) return sanitizeState(JSON.parse(raw));
  } catch {
    /* Speicher nicht verfügbar: Standardwerte nutzen */
  }
  return DEFAULT_STATE;
}

export default function App() {
  const [state, setState] = useState<PlannerState>(loadState);
  const [activeTab, setActiveTab] = useState<TabId>('ziel');
  const [hoveredYear, setHoveredYear] = useState<number | null>(null);
  const tabRefs = useRef<Record<string, HTMLButtonElement | null>>({});

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* ignorieren */
    }
  }, [state]);

  const set: Setter = useCallback((key, value) => setState((prev) => applyChange(prev, key, value)), []);
  const result = useMemo(() => calculate(state), [state]);
  const onHover = useCallback((y: number | null) => setHoveredYear(y), []);

  // Ergebnis für Screenreader ansagen, sobald sich die Eingaben eine Sekunde nicht mehr ändern
  const announcement = summaryText(state, result);
  const [spoken, setSpoken] = useState('');
  useEffect(() => {
    const t = window.setTimeout(() => setSpoken(announcement), 1000);
    return () => window.clearTimeout(t);
  }, [announcement]);

  // Tabs nach ARIA-Muster: Pfeiltasten, Pos1, Ende
  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    const i = TABS.findIndex((t) => t.id === activeTab);
    let next = -1;
    if (e.key === 'ArrowRight') next = (i + 1) % TABS.length;
    if (e.key === 'ArrowLeft') next = (i - 1 + TABS.length) % TABS.length;
    if (e.key === 'Home') next = 0;
    if (e.key === 'End') next = TABS.length - 1;
    if (next < 0) return;
    e.preventDefault();
    setActiveTab(TABS[next].id);
    tabRefs.current[TABS[next].id]?.focus();
  };

  const totalSave = state.btcSave + state.etfSave;
  const overBudget = totalSave > SAVINGS_BUDGET;

  return (
    <main className="app">
      <header className="header">
        <div>
          <h1>Rentenplaner</h1>
          <p className="meta">
            Sparrate <strong>{totalSave} €</strong> von {SAVINGS_BUDGET} € im Monat
            {overBudget && <span className="over"> · über Budget</span>} · Alter {state.startAge} bis {state.retireAge}
          </p>
        </div>
        <ResetButton onReset={() => setState(DEFAULT_STATE)} />
      </header>

      <Summary s={state} r={result} />

      <section aria-label="Eingaben">
        <div className="tabs" role="tablist" aria-label="Eingaben">
          {TABS.map((t) => {
            const active = activeTab === t.id;
            return (
              <button
                key={t.id}
                ref={(el) => {
                  tabRefs.current[t.id] = el;
                }}
                type="button"
                role="tab"
                id={`tab-${t.id}`}
                className="tab"
                aria-selected={active}
                aria-controls={`panel-${t.id}`}
                tabIndex={active ? 0 : -1}
                onClick={() => setActiveTab(t.id)}
                onKeyDown={onTabKey}
              >
                {t.label}
              </button>
            );
          })}
        </div>
        <div className="panel" role="tabpanel" id={`panel-${activeTab}`} aria-labelledby={`tab-${activeTab}`}>
          {activeTab === 'ziel' && <PanelZiel s={state} set={set} r={result} />}
          {activeTab === 'bitcoin' && <PanelBitcoin s={state} set={set} r={result} />}
          {activeTab === 'etf' && <PanelEtf s={state} set={set} />}
          {activeTab === 'annahmen' && <PanelAnnahmen s={state} set={set} r={result} />}
          {activeTab === 'risiko' && <PanelRisiko s={state} set={set} r={result} />}
        </div>
      </section>

      <Results s={state} set={set} r={result} />

      <section className="section" aria-labelledby="chart-title">
        <div className="section-head">
          <h2 id="chart-title">Verlauf</h2>
        </div>
        <PlannerChart s={state} r={result} hoveredYear={hoveredYear} onHover={onHover} />
      </section>

      <p className="footnote">
        Modellrechnung mit gleichmäßigen Renditen. Reale Verläufe schwanken stark; bei Bitcoin sind zwischenzeitliche Einbrüche
        von 70–80 % historisch normal. Deine Eingaben werden nur in diesem Browser gespeichert. Keine Anlage- oder Steuerberatung.
      </p>

      <div className="visually-hidden" role="status" aria-live="polite">
        {spoken}
      </div>
    </main>
  );
}

/** Zurücksetzen mit Bestätigung im Button selbst (Browser-Dialoge sind nicht überall verfügbar). */
function ResetButton({ onReset }: { onReset: () => void }) {
  const [armed, setArmed] = useState(false);
  useEffect(() => {
    if (!armed) return;
    const t = window.setTimeout(() => setArmed(false), 4000);
    return () => window.clearTimeout(t);
  }, [armed]);
  return (
    <button
      type="button"
      id="reset"
      className="btn"
      data-armed={armed}
      onClick={() => {
        if (armed) {
          onReset();
          setArmed(false);
        } else setArmed(true);
      }}
    >
      {armed ? 'Wirklich zurücksetzen?' : 'Zurücksetzen'}
    </button>
  );
}

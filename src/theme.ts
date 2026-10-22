import { useEffect, useState } from 'react';

/** Alle Farben laufen über CSS-Variablen (definiert in index.css), damit Hell- und Dunkelmodus funktionieren. */
export const C = {
  bg: 'var(--bg)',
  card: 'var(--card)',
  text: 'var(--text)',
  sub: 'var(--sub)',
  border: 'var(--border)',
  track: 'var(--track)',
  blue: 'var(--blue)',
  btc: 'var(--btc)',
  etf: 'var(--etf)',
  target: 'var(--target)',
  rest: 'var(--rest)',
  red: 'var(--red)',
  amber: 'var(--amber)',
} as const;

export type Tone = 'green' | 'blue' | 'amber' | 'red';

export const TONES: Record<Tone, { color: string; bg: string; text: string }> = {
  green: { color: 'var(--green)', bg: 'var(--green-bg)', text: 'var(--green-text)' },
  blue: { color: 'var(--blue)', bg: 'var(--blue-bg)', text: 'var(--blue-text)' },
  amber: { color: 'var(--amber)', bg: 'var(--amber-bg)', text: 'var(--amber-text)' },
  red: { color: 'var(--red)', bg: 'var(--red-bg)', text: 'var(--red-text)' },
};

/** Halbtransparente Variante einer Token-Farbe, z. B. für Rahmen. */
export const alpha = (color: string, pct: number) => `color-mix(in srgb, ${color} ${pct}%, transparent)`;

const CHART_TOKENS = ['--sub', '--border', '--btc', '--etf', '--blue', '--rest', '--target', '--red'] as const;
type ChartPalette = Record<(typeof CHART_TOKENS)[number], string>;

function readPalette(): ChartPalette {
  const cs = getComputedStyle(document.documentElement);
  return Object.fromEntries(CHART_TOKENS.map((t) => [t, cs.getPropertyValue(t).trim()])) as ChartPalette;
}

/** Aufgelöste Farbwerte fürs SVG-Chart; aktualisiert sich bei Wechsel des Farbschemas. */
export function useChartPalette(): ChartPalette {
  const [p, setP] = useState<ChartPalette>(readPalette);
  useEffect(() => {
    const update = () => setP(readPalette());
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    mq.addEventListener('change', update);
    const mo = new MutationObserver(update);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class', 'style'] });
    return () => {
      mq.removeEventListener('change', update);
      mo.disconnect();
    };
  }, []);
  return p;
}

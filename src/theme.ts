import { useEffect, useState } from 'react';

export type Tone = 'ok' | 'info' | 'warn' | 'bad';

const CHART_TOKENS = ['--muted', '--border', '--btc', '--etf', '--accent', '--rest', '--target', '--danger'] as const;
export type ChartPalette = Record<(typeof CHART_TOKENS)[number], string>;

function readPalette(): ChartPalette {
  const cs = getComputedStyle(document.documentElement);
  return Object.fromEntries(CHART_TOKENS.map((t) => [t, cs.getPropertyValue(t).trim()])) as ChartPalette;
}

/** Aufgelöste Farbwerte fürs SVG-Chart; aktualisiert sich bei Wechsel von Farbschema oder Kontrast. */
export function useChartPalette(): ChartPalette {
  const [p, setP] = useState<ChartPalette>(readPalette);
  useEffect(() => {
    const update = () => setP(readPalette());
    const queries = ['(prefers-color-scheme: dark)', '(prefers-contrast: more)'].map((q) => window.matchMedia(q));
    queries.forEach((mq) => mq.addEventListener('change', update));
    const mo = new MutationObserver(update);
    mo.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme', 'class', 'style'] });
    return () => {
      queries.forEach((mq) => mq.removeEventListener('change', update));
      mo.disconnect();
    };
  }, []);
  return p;
}

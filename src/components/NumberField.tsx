import { useEffect, useState } from 'react';
import { C } from '../theme';

interface Props {
  label: string;
  value: number;
  min: number;
  max: number;
  decimals?: number;
  suffix?: string;
  onChange: (v: number) => void;
}

const toText = (v: number, decimals: number) =>
  v.toLocaleString('de-DE', { maximumFractionDigits: decimals, useGrouping: false });

/** Zahlenfeld mit deutscher Eingabe (Komma) und Dezimal-Tastatur auf dem iPhone. */
export function NumberField({ label, value, min, max, decimals = 8, suffix, onChange }: Props) {
  const [text, setText] = useState(() => toText(value, decimals));

  useEffect(() => {
    const parsed = parseFloat(text.replace(',', '.'));
    if (parsed !== value) setText(toText(value, decimals));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return (
    <label style={{ display: 'block', marginBottom: 18 }}>
      <span style={{ display: 'block', fontSize: 13, color: C.sub, marginBottom: 6 }}>{label}</span>
      <span style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <input
          type="text"
          inputMode={decimals > 0 ? 'decimal' : 'numeric'}
          value={text}
          onChange={(e) => {
            const raw = e.target.value.replace(/[^\d.,]/g, '');
            setText(raw);
            const v = parseFloat(raw.replace(',', '.'));
            if (Number.isFinite(v)) onChange(Math.min(max, Math.max(min, v)));
            else if (raw === '') onChange(min);
          }}
          onBlur={() => setText(toText(value, decimals))}
          style={{
            flex: 1,
            minWidth: 0,
            padding: '11px 12px',
            fontSize: 17,
            fontWeight: 650,
            border: `1px solid ${C.border}`,
            borderRadius: 10,
            background: C.card,
            color: C.text,
            fontVariantNumeric: 'tabular-nums',
          }}
        />
        {suffix && <span style={{ fontSize: 14, color: C.sub }}>{suffix}</span>}
      </span>
    </label>
  );
}

import { C } from '../theme';

interface Props {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  onChange: (v: number) => void;
}

export function SliderRow({ label, value, min, max, step, display, onChange }: Props) {
  return (
    <div style={{ marginBottom: 20 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 8, gap: 12 }}>
        <span style={{ fontSize: 13, color: C.sub }}>{label}</span>
        <span style={{ fontSize: 15, fontWeight: 650, color: C.text, fontVariantNumeric: 'tabular-nums', whiteSpace: 'nowrap' }}>
          {display}
        </span>
      </div>
      <input
        type="range"
        className="slider"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
    </div>
  );
}

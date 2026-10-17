import { C } from '../theme';

interface Props {
  label: string;
  value: string;
  sub?: string;
  color?: string;
}

export function MetricCard({ label, value, sub, color }: Props) {
  return (
    <div style={{ background: C.bg, border: `1px solid ${C.border}`, borderRadius: 10, padding: '12px 14px', minWidth: 0 }}>
      <div style={{ fontSize: 11.5, color: C.sub, marginBottom: 4, lineHeight: 1.3 }}>{label}</div>
      <div style={{ fontSize: 17, fontWeight: 700, color: color ?? C.text, fontVariantNumeric: 'tabular-nums', overflowWrap: 'anywhere' }}>
        {value}
      </div>
      {sub && <div style={{ fontSize: 11, color: C.sub, marginTop: 3, lineHeight: 1.3 }}>{sub}</div>}
    </div>
  );
}

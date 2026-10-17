import type { ReactNode } from 'react';
import { C, TONES, type Tone } from '../theme';

export function InfoBox({ tone, children }: { tone: Tone; children: ReactNode }) {
  const t = TONES[tone];
  return (
    <div
      style={{
        background: t.bg,
        border: `1px solid ${t.color}33`,
        borderLeft: `4px solid ${t.color}`,
        borderRadius: 10,
        padding: '12px 14px',
        fontSize: 13,
        lineHeight: 1.65,
        marginBottom: 18,
        color: C.text,
      }}
    >
      {children}
    </div>
  );
}

export function InfoGridItem({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ background: C.card, border: `1px solid ${C.border}`, borderRadius: 10, padding: '12px 14px', minWidth: 0 }}>
      <div style={{ fontSize: 11.5, color: C.sub, marginBottom: 4, lineHeight: 1.3 }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 650, fontVariantNumeric: 'tabular-nums', overflowWrap: 'anywhere' }}>{value}</div>
    </div>
  );
}

export function Note({ children }: { children: ReactNode }) {
  return <p style={{ fontSize: 12.5, color: C.sub, lineHeight: 1.55, margin: '0 0 14px' }}>{children}</p>;
}

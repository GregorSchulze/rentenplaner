import { C } from '../theme';

interface Props {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}

export function Toggle({ label, description, checked, onChange }: Props) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 14,
        width: '100%',
        padding: '12px 14px',
        marginBottom: 14,
        background: C.card,
        border: `1px solid ${C.border}`,
        borderRadius: 10,
        cursor: 'pointer',
        textAlign: 'left',
        font: 'inherit',
        color: C.text,
      }}
    >
      <span style={{ minWidth: 0 }}>
        <span style={{ display: 'block', fontSize: 14, fontWeight: 650 }}>{label}</span>
        {description && <span style={{ display: 'block', fontSize: 12, color: C.sub, marginTop: 2, lineHeight: 1.4 }}>{description}</span>}
      </span>
      <span
        aria-hidden
        style={{
          flexShrink: 0,
          width: 46,
          height: 28,
          borderRadius: 999,
          background: checked ? C.blue : 'var(--switch-off)',
          position: 'relative',
          transition: 'background 0.15s',
        }}
      >
        <span
          style={{
            position: 'absolute',
            top: 3,
            left: checked ? 21 : 3,
            width: 22,
            height: 22,
            borderRadius: '50%',
            background: 'var(--knob)',
            boxShadow: '0 1px 3px rgba(0,0,0,0.25)',
            transition: 'left 0.15s',
          }}
        />
      </span>
    </button>
  );
}

interface SegProps<T extends string> {
  options: { value: T; label: string }[];
  value: T | null;
  onChange: (v: T) => void;
  ariaLabel: string;
}

export function Segmented<T extends string>({ options, value, onChange, ariaLabel }: SegProps<T>) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} style={{ display: 'flex', background: C.track, borderRadius: 10, padding: 3, gap: 3 }}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={active}
            onClick={() => onChange(o.value)}
            style={{
              flex: 1,
              padding: '8px 10px',
              fontSize: 13,
              fontWeight: active ? 700 : 500,
              color: active ? C.text : C.sub,
              background: active ? C.card : 'transparent',
              border: 'none',
              borderRadius: 8,
              boxShadow: active ? '0 1px 2px rgba(0,0,0,0.12)' : 'none',
              cursor: 'pointer',
              font: 'inherit',
              whiteSpace: 'nowrap',
            }}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}

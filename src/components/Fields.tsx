import { useEffect, useId, useState, type ReactNode } from 'react';

/* Bedienelemente auf Basis nativer HTML-Elemente: Tastatur und Screenreader funktionieren ohne Zusatzlogik. */

interface SliderProps {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  display: string;
  hint?: ReactNode;
  onChange: (v: number) => void;
}

export function Slider({ label, value, min, max, step, display, hint, onChange }: SliderProps) {
  const id = useId();
  return (
    <div className="field">
      <div className="field-head">
        <label className="field-label" htmlFor={id}>
          {label}
        </label>
        <span className="field-value" aria-hidden="true">
          {display}
        </span>
      </div>
      <input
        id={id}
        type="range"
        className="slider"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-valuetext={display}
        aria-describedby={hint ? `${id}-hint` : undefined}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
      {hint && (
        <p className="hint" id={`${id}-hint`}>
          {hint}
        </p>
      )}
    </div>
  );
}

interface NumberFieldProps {
  label: string;
  value: number;
  min: number;
  max: number;
  decimals?: number;
  suffix?: string;
  hint?: string;
  onChange: (v: number) => void;
}

const toText = (v: number, decimals: number) => v.toLocaleString('de-DE', { maximumFractionDigits: decimals, useGrouping: false });
const parse = (t: string) => parseFloat(t.replace(',', '.'));

/**
 * Zahlenfeld mit deutscher Eingabe. Werte werden erst übernommen, wenn sie gültig sind;
 * beim Verlassen des Felds wird auf den erlaubten Bereich begrenzt. So springt das Feld beim Tippen nicht.
 */
export function NumberField({ label, value, min, max, decimals = 8, suffix, hint, onChange }: NumberFieldProps) {
  const id = useId();
  const [text, setText] = useState(() => toText(value, decimals));
  const [focused, setFocused] = useState(false);

  useEffect(() => {
    if (!focused) setText(toText(value, decimals));
  }, [value, focused, decimals]);

  const parsed = parse(text);
  const invalid = text !== '' && (!Number.isFinite(parsed) || parsed < min || parsed > max);
  const rangeText = `Erlaubt: ${toText(min, decimals)} bis ${toText(max, decimals)}${suffix ? ` ${suffix}` : ''}`;
  const describedBy = [hint ? `${id}-hint` : null, invalid ? `${id}-error` : null].filter(Boolean).join(' ') || undefined;

  return (
    <div className="field">
      <label className="field-label" htmlFor={id}>
        {label}
      </label>
      <div className="input-wrap">
        <input
          id={id}
          className="input"
          type="text"
          inputMode={decimals > 0 ? 'decimal' : 'numeric'}
          autoComplete="off"
          value={text}
          aria-invalid={invalid}
          aria-describedby={describedBy}
          onFocus={() => setFocused(true)}
          onChange={(e) => {
            const raw = e.target.value.replace(/[^\d.,]/g, '');
            setText(raw);
            const v = parse(raw);
            if (Number.isFinite(v) && v >= min && v <= max) onChange(v);
          }}
          onBlur={() => {
            setFocused(false);
            const v = parse(text);
            const next = Number.isFinite(v) ? Math.min(max, Math.max(min, decimals === 0 ? Math.round(v) : v)) : value;
            onChange(next);
            setText(toText(next, decimals));
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
          }}
        />
        {suffix && (
          <span className="suffix" aria-hidden="true">
            {suffix}
          </span>
        )}
      </div>
      {hint && (
        <p className="hint" id={`${id}-hint`}>
          {hint}
        </p>
      )}
      {invalid && (
        <p className="error" id={`${id}-error`}>
          {rangeText}
        </p>
      )}
    </div>
  );
}

interface SwitchProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}

export function Switch({ label, description, checked, onChange }: SwitchProps) {
  const id = useId();
  return (
    <label className="switch" htmlFor={id}>
      <span className="switch-text">
        <span className="switch-label" id={`${id}-label`}>
          {label}
        </span>
        {description && (
          <span className="hint" id={`${id}-desc`}>
            {description}
          </span>
        )}
      </span>
      <input
        id={id}
        type="checkbox"
        role="switch"
        className="switch-input"
        checked={checked}
        aria-labelledby={`${id}-label`}
        aria-describedby={description ? `${id}-desc` : undefined}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="switch-track" aria-hidden="true" />
    </label>
  );
}

interface RadioGroupProps<T extends string> {
  legend: string;
  legendHidden?: boolean;
  name: string;
  value: T | null;
  options: { value: T; label: string; detail?: string }[];
  onChange: (v: T) => void;
}

export function RadioGroup<T extends string>({ legend, legendHidden, name, value, options, onChange }: RadioGroupProps<T>) {
  const id = useId();
  return (
    <fieldset className="segmented">
      <legend className={legendHidden ? 'visually-hidden' : 'field-label'}>{legend}</legend>
      <div className="segmented-options">
        {options.map((o) => (
          <label className="segment" key={o.value}>
            <input type="radio" name={`${name}-${id}`} value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} />
            <span>
              {o.label}
              {o.detail && <small>{o.detail}</small>}
            </span>
          </label>
        ))}
      </div>
    </fieldset>
  );
}

export function Callout({ tone, title, children }: { tone: 'ok' | 'info' | 'warn' | 'bad'; title?: ReactNode; children?: ReactNode }) {
  return (
    <div className={`callout tone-${tone}`}>
      {title && <p className="callout-title">{title}</p>}
      {children}
    </div>
  );
}

export function Group({ legend, children }: { legend: string; children: ReactNode }) {
  return (
    <fieldset className="group">
      <legend>{legend}</legend>
      {children}
    </fieldset>
  );
}

export function Stat({ label, value, sub, ink }: { label: string; value: string; sub?: string; ink?: string }) {
  return (
    <div className="stat">
      <dt>{label}</dt>
      <dd className={ink}>{value}</dd>
      {sub && <dd className="stat-sub">{sub}</dd>}
    </div>
  );
}

import { fmt, pct } from '../calc';
import type { PlannerResult, PlannerState, Setter } from '../types';
import { InfoGridItem } from './InfoBox';
import { NumberField } from './NumberField';
import { SliderRow } from './SliderRow';

interface Props {
  s: PlannerState;
  set: Setter;
  r: PlannerResult;
}

export function TabBestand({ s, set, r }: Props) {
  return (
    <div>
      <NumberField label="Meine BTC-Menge" value={s.btcAmount} min={0} max={100} suffix="BTC" onChange={(v) => set('btcAmount', v)} />
      <SliderRow
        label="BTC-Preis heute"
        value={s.btcPrice}
        min={30000}
        max={200000}
        step={1000}
        display={fmt(s.btcPrice)}
        onChange={(v) => set('btcPrice', v)}
      />
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <InfoGridItem label="Aktueller Wert" value={fmt(r.btcCurrentValue)} />
        <InfoGridItem label="In Satoshi" value={r.btcSats.toLocaleString('de-DE')} />
        <InfoGridItem
          label={`Bestand mit ${s.retireAge} (Ø ${pct(r.btcAvgRate)} p.a.${s.showReal ? ', real' : ''})`}
          value={fmt(r.btcHoldingFinal)}
        />
        <InfoGridItem
          label="Anteil an 21 Mio. BTC"
          value={`${r.btcSupplyShare.toLocaleString('de-DE', { maximumSignificantDigits: 3 })} %`}
        />
      </div>
    </div>
  );
}

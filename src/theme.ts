export const C = {
  bg: '#f5f5f4',
  card: '#ffffff',
  text: '#1c1917',
  sub: '#78716c',
  border: '#e7e5e4',
  blue: '#378ADD',
  btc: '#D85A30',
  etf: '#1D9E75',
  target: '#888780',
  rest: '#7F77DD',
  red: '#dc2626',
  amber: '#d97706',
} as const;

export type Tone = 'green' | 'blue' | 'amber' | 'red';

export const TONES: Record<Tone, { color: string; bg: string; text: string }> = {
  green: { color: '#1D9E75', bg: '#e6f4ee', text: '#136b4e' },
  blue: { color: '#378ADD', bg: '#e8f1fb', text: '#1d5fa3' },
  amber: { color: '#d97706', bg: '#fdf3e3', text: '#92600a' },
  red: { color: '#dc2626', bg: '#fbeaea', text: '#b91c1c' },
};

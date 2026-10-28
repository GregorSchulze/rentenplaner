import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App';
import './index.css';

// Sprache für Screenreader und Silbentrennung (auch wenn die Hülle kein lang setzt)
if (!document.documentElement.lang) document.documentElement.lang = 'de';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

// Offline-Fähigkeit: Service Worker nur im Produktions-Build registrieren
if ('serviceWorker' in navigator && import.meta.env.PROD && import.meta.env.MODE !== 'artifact') {
  const SW_URL = './sw.js';
  // Die CSP verlangt Trusted Types: nur genau diese Skript-URL zulassen, HTML- und Skript-Strings bleiben gesperrt
  type TrustedTypes = { createPolicy(name: string, rules: { createScriptURL(url: string): string | null }): unknown };
  (window as { trustedTypes?: TrustedTypes }).trustedTypes?.createPolicy('default', {
    createScriptURL: (url) => (url === SW_URL ? url : null),
  });
  window.addEventListener('load', () => {
    navigator.serviceWorker.register(SW_URL).catch(() => {
      /* ohne Offline-Modus weiterlaufen */
    });
  });
}

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
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('./sw.js').catch(() => {
      /* ohne Offline-Modus weiterlaufen */
    });
  });
}

import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Content-Security-Policy für GitHub Pages. Dort lassen sich keine HTTP-Header setzen,
// daher als <meta> (frame-ancestors, report-uri und sandbox wirken im <meta> nicht).
// Inline-Styles von React/Recharts laufen über element.style und brauchen kein 'unsafe-inline'.
// connect-src 'self' nur für den Modulepreload-Polyfill von Vite; die App lädt sonst nichts nach.
// Trusted Types: einzige Policy "default" erlaubt nur die Service-Worker-URL (siehe main.tsx).
const CSP = [
  "default-src 'none'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self'",
  "connect-src 'self'",
  "manifest-src 'self'",
  "worker-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
  "require-trusted-types-for 'script'",
  'trusted-types default',
].join('; ');

// Direkt nach <meta charset> einfügen: vor allen Skripten, Charset bleibt in den ersten 1024 Bytes.
// Fehlt die Stelle, bricht der Build ab, statt still ohne CSP auszuliefern.
function cspMeta(): Plugin {
  const anchor = '<meta charset="UTF-8" />';
  return {
    name: 'csp-meta',
    apply: 'build',
    transformIndexHtml(html) {
      if (!html.includes(anchor)) throw new Error(`csp-meta: ${anchor} nicht in index.html gefunden`);
      return html.replace(anchor, `${anchor}\n    <meta http-equiv="Content-Security-Policy" content="${CSP}" />`);
    },
  };
}

// "artifact"-Modus: alles in eine HTML-Datei für die Claude-Seite (Inline-Skripte, daher ohne CSP).
// Standard: relative Pfade für GitHub Pages, mit CSP.
export default defineConfig(({ mode }) => ({
  base: './',
  plugins: mode === 'artifact' ? [react(), viteSingleFile()] : [react(), cspMeta()],
  publicDir: mode === 'artifact' ? false : 'public',
  build: { chunkSizeWarningLimit: 800, outDir: mode === 'artifact' ? 'dist-artifact' : 'dist' },
}));

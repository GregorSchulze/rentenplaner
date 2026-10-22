import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// "artifact"-Modus: alles in eine HTML-Datei für die Claude-Seite.
// Standard: relative Pfade für GitHub Pages.
export default defineConfig(({ mode }) => ({
  base: './',
  plugins: mode === 'artifact' ? [react(), viteSingleFile()] : [react()],
  publicDir: mode === 'artifact' ? false : 'public',
  build: { chunkSizeWarningLimit: 800, outDir: mode === 'artifact' ? 'dist-artifact' : 'dist' },
}));

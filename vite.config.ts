import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// Relative Pfade, damit die App unter https://<user>.github.io/rentenplaner/ läuft
export default defineConfig({
  base: './',
  plugins: [react()],
  build: { chunkSizeWarningLimit: 800 },
});

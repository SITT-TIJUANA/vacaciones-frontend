import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// CAMBIA 'vacaciones-frontend' por el nombre exacto de tu repo en GitHub
export default defineConfig({
  plugins: [react()],
  base: '/vacaciones-frontend/',
  build: {
    outDir: 'dist',
    sourcemap: false,
    // Force rebuild
  },
});

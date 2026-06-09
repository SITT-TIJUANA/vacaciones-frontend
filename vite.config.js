import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/vacaciones-frontend/',
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
});

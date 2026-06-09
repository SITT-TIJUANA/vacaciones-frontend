import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/vacaciones-frontend/',
  build: {
    outDir: 'dist',
    sourcemap: false,
    rollupOptions: {
      output: {
        entryFileNames: `assets/[name]-v3-[hash].js`,
        chunkFileNames: `assets/[name]-v3-[hash].js`,
        assetFileNames: `assets/[name]-v3-[hash].[ext]`,
      }
    }
  },
});
 

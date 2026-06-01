import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: {
    port: 5173,
  },
  build: {
    outDir: 'dist',
    sourcemap: mode !== 'production',
    target: 'es2020',
    minify: 'esbuild',
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom', 'axios'],
          firebase: ['firebase/app', 'firebase/auth'],
          charts: ['recharts'],
          forms: ['react-hook-form', '@hookform/resolvers/zod'],
        },
      },
    },
  },
}));

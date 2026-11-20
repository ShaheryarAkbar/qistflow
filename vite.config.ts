import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

// https://vitejs.dev/config/
export default defineConfig(({ command, mode }) => ({
  plugins: [react()],
  // In dev server ('development'), use '/' so http://localhost:3000 works directly.
  // In production build ('production'), use '/qistflow/' so GitHub Pages assets load correctly.
  base: process.env.VITE_BASE_PATH || (mode === 'development' ? '/' : '/qistflow/'),
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
  },
}));

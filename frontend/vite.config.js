import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => ({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': { target: 'http://localhost:4000', changeOrigin: true },
      '/ws':  { target: 'ws://localhost:4000',  changeOrigin: true, ws: true },
    },
  },
  build: { outDir: 'dist', sourcemap: mode === 'development' },
  define: {
    __API_URL__: JSON.stringify(process.env.VITE_API_URL || ''),
    __WS_URL__:  JSON.stringify(process.env.VITE_WS_URL  || ''),
  },
}));

import react from '@vitejs/plugin-react';
import path from 'node:path';
import {defineConfig} from 'vite';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@play/pylon': path.resolve(__dirname, '../../packages/pylon/src'),
      '@play/supabase': path.resolve(__dirname, '../../packages/supabase/src'),
    },
  },
  server: {
    port: 3000,
    host: true,
    proxy: {
      '/api': {
        target: 'http://127.0.0.1:8787',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
});

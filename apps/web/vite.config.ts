import {reactRouter} from '@react-router/dev/vite';
import {cloudflareDevProxy} from '@react-router/dev/vite/cloudflare';
import tailwindcss from '@tailwindcss/postcss';
import autoprefixer from 'autoprefixer';
import path from 'node:path';
import {defineConfig} from 'vite';

export default defineConfig({
  plugins: [cloudflareDevProxy(), reactRouter()],
  css: {
    postcss: {
      plugins: [tailwindcss(), autoprefixer()],
    },
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './app'),
      '@play/pylon': path.resolve(__dirname, '../../packages/pylon/src'),
      '@play/supabase-client': path.resolve(
        __dirname,
        '../../packages/supabase-client/src',
      ),
    },
  },
});

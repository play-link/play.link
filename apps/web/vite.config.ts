import {reactRouter} from '@react-router/dev/vite';
import {cloudflareDevProxy} from '@react-router/dev/vite/cloudflare';
import tailwindcss from '@tailwindcss/postcss';
import autoprefixer from 'autoprefixer';
import path from 'node:path';
import {defineConfig} from 'vite';
import type {Plugin} from 'vite';

function styledComponentsPlugin(): Plugin {
  return {
    name: 'styled-components',
    enforce: 'pre',
    async transform(code, id) {
      if (!id.match(/\.[jt]sx?$/) || id.includes('node_modules')) return;
      if (!code.includes('styled')) return;

      // @ts-expect-error - no type declarations for @babel/core
      const babel = await import('@babel/core');
      const result = babel.transformSync(code, {
        filename: id,
        plugins: [['babel-plugin-styled-components', {ssr: true, displayName: true, fileName: true}]],
        parserOpts: {plugins: ['typescript', 'jsx']},
        babelrc: false,
        configFile: false,
      });

      if (!result?.code) return;
      return {code: result.code, map: result.map};
    },
  };
}

export default defineConfig({
  plugins: [cloudflareDevProxy(), styledComponentsPlugin(), reactRouter()],
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

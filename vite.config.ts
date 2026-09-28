import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import { VitePWA } from 'vite-plugin-pwa';
export default defineConfig({
  base: '/twistylab/',
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['icon.svg'],
      manifest: {
        name: 'TwistyLab',
        short_name: 'TwistyLab',
        description: 'Your speedcubing workspace',
        theme_color: '#111512',
        background_color: '#111512',
        display: 'standalone',
        start_url: './',
        icons: [{ src: 'icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' }],
      },
      workbox: {
        maximumFileSizeToCacheInBytes: 12000000,
        globPatterns: ['**/*.{js,css,html,svg,wasm}'],
      },
    }),
  ],
  worker: { format: 'es' },
  build: {
    target: 'es2022',
    // cubing.js imports its worker entry as a module URL. Keep worker-safe modules
    // separate from React/DOM chunks and do not inject DOM preload helpers.
    modulePreload: false,
    rollupOptions: {
      output: {
        onlyExplicitManualChunks: true,
        manualChunks(id) {
          const marker = '/node_modules/cubing/dist/lib/cubing/';
          const normalized = id.replaceAll('\\', '/');
          const offset = normalized.indexOf(marker);
          if (offset >= 0) {
            return (
              'cubing-' + normalized.slice(offset + marker.length).replace(/[^a-zA-Z0-9_-]/g, '-')
            );
          }
        },
      },
    },
  },
  test: { environment: 'jsdom', setupFiles: ['src/test/setup.ts'] },
});

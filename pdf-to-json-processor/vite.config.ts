/// <reference types="vitest" />
import { defineConfig } from 'vite';
// @ts-expect-error vite-plugin-eslint has broken type exports
import eslintPlugin from 'vite-plugin-eslint';

export default defineConfig({
  root: 'src',
  build: {
    outDir: '../dist',
    emptyOutDir: true,
  },
  plugins: [
    eslintPlugin({
      cache: false,
      include: ['**/*.ts']
    })
  ],
  server: {
    proxy: {
      '/api': {
        target: 'http://192.168.100.117:30134',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  // @ts-expect-error test is injected by vitest
  test: {
    environment: 'jsdom',
    setupFiles: ['./vitest.setup.ts']
  }
});

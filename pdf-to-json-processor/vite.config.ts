import { defineConfig } from 'vite';
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
  }
});

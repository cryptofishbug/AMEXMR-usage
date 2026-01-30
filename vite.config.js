import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

// GitHub Pages: cryptofishbug.github.io/AMEXMR-usage/
// 루트 도메인에 배포하면 base: '/'
export default defineConfig({
  // GitHub Pages for this repo is served at https://cryptofishbug.github.io/AMEXMR-usage/
  // (repo pages with source set to /docs). Assets should be under /AMEXMR-usage/ (no extra /docs).
  base: '/AMEXMR-usage/',
  plugins: [react(), tailwindcss()],
  build: {
    outDir: 'docs',
    emptyOutDir: true,
  },
  server: {
    port: 5173,
    strictPort: true,
    watch: {
      usePolling: true,
      interval: 500,
    },
    hmr: {
      overlay: true,
    },
    headers: {
      'Cache-Control': 'no-store, no-cache, must-revalidate',
    },
  },
})

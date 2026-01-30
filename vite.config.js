import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
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

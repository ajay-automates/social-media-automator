import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    open: true,
    proxy: {
      '/auth': 'http://localhost:3000',
    },
  },
  build: {
    outDir: '../landing-dist',
    emptyOutDir: true,
  },
})

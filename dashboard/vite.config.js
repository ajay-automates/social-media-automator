import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  base: '/',  // Use root base so assets load correctly
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      output: {
        manualChunks: {
          // React ecosystem (changes rarely - good for caching)
          'vendor-react': ['react', 'react-dom', 'react-router-dom'],

          // Animation library (heavy - 200KB+)
          'vendor-animation': ['framer-motion'],

          // Charts library (VERY heavy - only needed for Analytics page)
          'vendor-charts': ['recharts'],

          // UI utilities
          'vendor-ui': ['react-hot-toast'],
        },
      },
    },
  },
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
      '/auth': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  publicDir: 'public',
})

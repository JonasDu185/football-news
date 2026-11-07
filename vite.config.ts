import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { brandPlugin, brandConfig } from './vite.brand.ts'

const cfg = brandConfig()

export default defineConfig({
  base: cfg.basePath,
  plugins: [react(), tailwindcss(), brandPlugin()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    proxy: {
      '/api': 'http://localhost:3001',
      '/share': 'http://localhost:3001',
    },
  },
})

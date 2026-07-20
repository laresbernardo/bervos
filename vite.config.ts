import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { readFileSync } from 'fs'

const pkg = JSON.parse(readFileSync('./package.json', 'utf-8'))

// https://vite.dev/config/
export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(pkg.version),
  },
  plugins: [
    react(),
    tailwindcss(),
  ],
  server: {
    port: 2000,
    host: true,
    proxy: {
      '/api': {
        target: process.env.VITE_USE_EMULATOR === 'true'
          ? 'http://127.0.0.1:5001/bervos-official/us-central1/hubApi'
          : 'https://us-central1-bervos-official.cloudfunctions.net/hubApi',
        changeOrigin: true,
        secure: false,
      }
    }
  },
})

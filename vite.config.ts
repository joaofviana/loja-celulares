import { rmSync } from 'node:fs'
import path from 'node:path'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import electron from 'vite-plugin-electron/simple'

export default defineConfig({
  resolve: {
    alias: {
      '@': path.join(__dirname, 'src'),
    },
  },
  plugins: [
    react(),
    tailwindcss(),
    electron({
      main: {
        entry: 'electron/main/index.ts',
        vite: {
          build: {
            rollupOptions: {
              external: ['better-sqlite3'],
            },
          },
        },
      },
      preload: {
        input: path.join(__dirname, 'electron/preload/index.ts'),
      },
      renderer: {},
    }),
  ],
  clearScreen: false,
})

import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    setupFiles: [],
    exclude: ['**/theme-visual.spec.ts', '**/node_modules/**'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './'),
    },
  },
})
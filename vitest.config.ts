import { defineConfig } from 'vitest/config'
import path from 'path'

// Vitest config to resolve @ path alias and set test environment
export default defineConfig({
  resolve: {
    alias: [
      { find: '@', replacement: path.resolve(__dirname) },
    ],
  },
  test: {
    globals: true,
    environment: 'jsdom',
    include: ['**/__tests__/**/*.test.*', '**/__tests__/**/*.spec.*', 'store/**/__tests__/**/*.test.*'],
    setupFiles: [],
    silent: false,
  },
})

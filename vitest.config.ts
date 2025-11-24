import { fileURLToPath } from 'node:url'

import { defineConfig } from 'vitest/config'

const rootDirectory = fileURLToPath(new URL('./src', import.meta.url))
const testsDirectory = fileURLToPath(new URL('./tests', import.meta.url))

export default defineConfig({
  test: {
    globals: true,
    environment: 'node',
    include: ['tests/**/*.spec.ts'],
  },
  resolve: {
    alias: {
      '@': rootDirectory,
      '@tests': testsDirectory,
    },
  },
})

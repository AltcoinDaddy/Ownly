import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts'],
    globals: true,
    testTimeout: 60000, // Increased timeout for Flow emulator tests
    hookTimeout: 60000, // Increased timeout for setup/teardown hooks
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'test/',
        '**/*.d.ts',
        '**/*.config.*',
        'coverage/',
        '.next/',
        'public/',
        'styles/',
        'components/ui/**', // Exclude shadcn/ui components from coverage
        'contracts/**', // Exclude Cadence contracts from coverage
        'scripts/**', // Exclude Flow scripts from coverage
      ],
    },
    // Separate test patterns for different test types
    include: [
      'test/unit/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'test/integration/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'test/flow-emulator/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'
    ],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, '.'),
    },
  },
})
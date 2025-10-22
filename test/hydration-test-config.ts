import { defineConfig } from 'vitest/config'
import { resolve } from 'path'

/**
 * Specialized Vitest configuration for hydration testing
 * Includes specific setup for SSR/client consistency testing
 */
export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./test/setup.ts', './test/hydration-setup.ts'],
    globals: true,
    testTimeout: 30000, // Longer timeout for hydration tests
    hookTimeout: 30000,
    
    // Specific patterns for hydration tests
    include: [
      'test/unit/hydration-*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'test/unit/client-only.test.tsx',
      'test/unit/ssr-client-consistency.test.tsx',
      'test/integration/hydration-*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}',
      'test/integration/comprehensive-hydration-suite.test.tsx'
    ],
    
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      include: [
        'lib/hydration/**',
        'components/hydration-*',
        'components/client-only.tsx'
      ],
      exclude: [
        'node_modules/',
        'test/',
        '**/*.d.ts',
        '**/*.config.*'
      ],
      thresholds: {
        global: {
          branches: 80,
          functions: 80,
          lines: 80,
          statements: 80
        }
      }
    },
    
    // Environment-specific settings for hydration testing
    env: {
      NODE_ENV: 'test',
      NEXT_PUBLIC_FLOW_NETWORK: 'testnet'
    }
  },
  
  resolve: {
    alias: {
      '@': resolve(__dirname, '..'),
    },
  },
})
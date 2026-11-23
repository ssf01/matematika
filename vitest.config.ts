import { defineConfig } from 'vitest/config';

// Two projects: pure logic (src/lib, src/i18n *.test.ts) runs in the fast `node`
// environment; everything else (component tests, *.test.tsx) runs in jsdom.
// Inline projects inherit the root config by default since Vitest 5 (`extends: true`).
const nodeTests = ['src/lib/**/*.test.ts', 'src/i18n/**/*.test.ts'];

export default defineConfig({
  test: {
    globals: true,
    projects: [
      {
        test: {
          name: 'node',
          environment: 'node',
          include: nodeTests,
        },
      },
      {
        test: {
          name: 'dom',
          environment: 'jsdom',
          include: ['src/**/*.test.{ts,tsx}'],
          exclude: nodeTests,
          setupFiles: ['./src/test/setup.ts'],
        },
      },
    ],
    coverage: {
      provider: 'v8',
      include: ['src/lib/**/*.ts', 'src/i18n/**/*.ts'],
      exclude: ['**/*.test.ts', 'src/lib/types.ts'],
      reporter: ['text', 'html', 'lcov'],
    },
  },
});

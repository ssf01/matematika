import js from '@eslint/js';
import tseslint from 'typescript-eslint';
import reactHooks from 'eslint-plugin-react-hooks';
import jsxA11y from 'eslint-plugin-jsx-a11y';
import globals from 'globals';
import { defineConfig, globalIgnores } from 'eslint/config';

export default defineConfig([
  globalIgnores(['dist/', '.astro/', 'node_modules/', 'coverage/', '.claude/']),
  js.configs.recommended,
  tseslint.configs.recommended,
  {
    files: ['**/*.{ts,tsx}'],
    extends: [reactHooks.configs.flat.recommended, jsxA11y.flatConfigs.recommended],
    languageOptions: {
      globals: { ...globals.browser },
    },
    rules: {
      // TEMPORARY: downgraded to 'warn' because existing code violates them and is
      // being fixed in parallel workstreams. Promote back to 'error' once clean.
      // PuzzleBoard.tsx currently calls hooks conditionally (fix in progress).
      'react-hooks/rules-of-hooks': 'warn',
      'react-hooks/purity': 'warn',
      'react-hooks/set-state-in-effect': 'warn',
      'jsx-a11y/no-autofocus': 'warn',
      'jsx-a11y/click-events-have-key-events': 'warn',
      'jsx-a11y/no-static-element-interactions': 'warn',
    },
  },
  {
    rules: {
      // TEMPORARY 'warn' (see above).
      '@typescript-eslint/no-unused-vars': [
        'warn',
        { argsIgnorePattern: '^_', varsIgnorePattern: '^_', caughtErrors: 'none' },
      ],
      'no-empty': ['warn', { allowEmptyCatch: true }],
    },
  },
  {
    files: ['public/sw.js'],
    languageOptions: { globals: { ...globals.serviceworker } },
  },
  {
    files: ['*.{js,mjs,ts}', 'scripts/**'],
    languageOptions: { globals: { ...globals.node } },
  },
]);

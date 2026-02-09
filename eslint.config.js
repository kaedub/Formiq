import tsPlugin from '@typescript-eslint/eslint-plugin';
import tsParser from '@typescript-eslint/parser';

const strictTypeCheckedRules = tsPlugin.configs['strict-type-checked']?.rules ?? {};
const tsLanguageOptions = {
  parser: tsParser,
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
    projectService: {
      allowDefaultProject: [
        'packages/platform/prisma.config.ts',
        'packages/platform/prisma.config.d.ts',
        'packages/platform/vitest.config.ts',
        'packages/platform/vitest.config.d.ts',
        'packages/platform/prisma/seed.ts',
        'packages/platform/prisma/seed.d.ts',
      ],
    },
    tsconfigRootDir: import.meta.dirname,
  },
};
const tsRules = {
  ...strictTypeCheckedRules,
  '@typescript-eslint/no-explicit-any': 'error',
  '@typescript-eslint/no-unnecessary-condition': ['error', { allowConstantLoopConditions: true }],
  '@typescript-eslint/no-floating-promises': 'error',
  '@typescript-eslint/restrict-template-expressions': 'off',
  '@typescript-eslint/strict-boolean-expressions': 'off',
  '@typescript-eslint/no-misused-promises': 'off',
  '@typescript-eslint/no-confusing-void-expression': 'off',
};

export default [
  {
    files: ['**/*.ts', '**/*.tsx'],
    languageOptions: tsLanguageOptions,
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: tsRules,
  },
  {
    files: ['packages/platform/**/*.{ts,tsx}'],
    languageOptions: {
      ...tsLanguageOptions,
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: tsRules,
  },
  {
    files: ['apps/worker/**/*.{ts,tsx}'],
    languageOptions: {
      ...tsLanguageOptions,
    },
    plugins: {
      '@typescript-eslint': tsPlugin,
    },
    rules: tsRules,
  },
  {
    ignores: [
      '.yarn/',
      'node_modules/',
      'dist/',
      'apps/**/dist/',
      'packages/**/dist/',
      '**/vite.config.*.timestamp*',
      '**/vitest.config.*.timestamp*',
    ],
  },
];

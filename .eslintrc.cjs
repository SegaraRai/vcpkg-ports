// @ts-check

const { defineConfig } = require('eslint-define-config');

module.exports = defineConfig({
  root: true,
  env: {
    browser: true,
    node: true,
  },
  extends: [
    'eslint:recommended',
    'plugin:import/errors',
    'plugin:import/warnings',
    'plugin:astro/recommended',
    'prettier',
  ],
  plugins: ['unicorn', '@typescript-eslint'],
  parser: '@typescript-eslint/parser',
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  settings: {
    'import/internal-regex': '^[~$]',
  },
  overrides: [
    {
      files: ['*.astro'],
      parser: 'astro-eslint-parser',
      parserOptions: {
        parser: '@typescript-eslint/parser',
        extraFileExtensions: ['.astro'],
      },
      rules: {
        'astro/no-set-html-directive': 'error',
        '@typescript-eslint/no-unused-vars': [
          'error',
          {
            varsIgnorePattern: '^Props$',
          },
        ],
      },
    },
    // ...
  ],
  rules: {
    // rules obtained from Nuxt

    'import/first': 'error',
    'import/no-mutable-exports': 'error',
    'import/no-unresolved': 'off',
    'generator-star-spacing': 'off',
    'no-debugger': 'error',
    'no-console': 'warn',
    'prefer-const': [
      'error',
      {
        destructuring: 'any',
        ignoreReadBeforeAssign: false,
      },
    ],
    'no-lonely-if': 'error',
    curly: ['error', 'all'],
    'require-await': 'error',
    'dot-notation': 'error',
    'no-var': 'error',
    'object-shorthand': 'error',
    'no-useless-rename': 'error',

    'unicorn/error-message': 'error',
    'unicorn/escape-case': 'error',
    'unicorn/no-array-instanceof': 'error',
    'unicorn/no-new-buffer': 'error',
    'unicorn/no-unsafe-regex': 'off',
    'unicorn/number-literal-case': 'off',
    'unicorn/prefer-exponentiation-operator': 'error',
    'unicorn/prefer-includes': 'error',
    'unicorn/prefer-starts-ends-with': 'error',
    'unicorn/prefer-text-content': 'error',
    'unicorn/prefer-type-error': 'error',
    'unicorn/throw-new-error': 'error',

    // TypeScript rules

    'no-undef': 'off',

    'no-unused-vars': 'off',
    '@typescript-eslint/no-unused-vars': [
      'error',
      { args: 'all', argsIgnorePattern: '^_' },
    ],

    'no-redeclare': 'off',
    '@typescript-eslint/no-redeclare': ['error'],

    // our rules

    'no-constant-condition': [
      'warn',
      {
        checkLoops: false,
      },
    ],
    'arrow-parens': ['error', 'always'],
    'spaced-comment': [
      'warn',
      'always',
      {
        line: {
          exceptions: ['-', '+', '*/'],
          markers: ['=', '!', '/'],
        },
      },
    ],
    'sort-imports': [
      'error',
      {
        ignoreCase: false,
        ignoreDeclarationSort: true,
        ignoreMemberSort: false,
        allowSeparatedGroups: true,
      },
    ],
    'import/named': 'off',
    'import/order': [
      'error',
      {
        alphabetize: {
          order: 'asc',
          caseInsensitive: false,
        },
        groups: [
          'builtin',
          'external',
          'unknown',
          'internal',
          'parent',
          'sibling',
          'index',
        ],
        pathGroups: [
          {
            pattern: '$/**',
            group: 'internal',
          },
          {
            pattern: '$prisma/**',
            group: 'internal',
            position: 'before',
          },
          {
            pattern: '$*/**',
            group: 'unknown',
          },
        ],
        pathGroupsExcludedImportTypes: ['builtin', 'external'],
      },
    ],

    '@typescript-eslint/no-non-null-assertion': ['warn'],
  },
});

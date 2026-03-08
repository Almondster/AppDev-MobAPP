// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require('eslint-config-expo/flat');

module.exports = defineConfig([
  expoConfig,
  {
    ignores: ['dist/*', 'build/*', '.expo/*', 'node_modules/*'],
    settings: {
      'import/core-modules': ['expo-linear-gradient'],
    },
    rules: {
      // Disable overly strict rules that cause false positives
      '@typescript-eslint/no-unused-vars': ['warn', { 
        argsIgnorePattern: '^_',
        varsIgnorePattern: '^_',
        caughtErrorsIgnorePattern: '^_'
      }],
      'react-hooks/exhaustive-deps': 'warn', // Change from error to warning
      'react/no-unescaped-entities': 'off', // Allow quotes in JSX
      'no-unused-vars': 'off', // Use TypeScript's unused vars instead
    },
  },
]);
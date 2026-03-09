// eslint.config.js (ESLint v9+ flat config)
module.exports = [
  {
    ignores: ['assets/**', 'dist/**', 'build/**', 'coverage/**'],
  },
  {
    files: ['**/*.js'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'commonjs',
    },
    rules: {
      // keep close to legacy config but be lenient for this repo
      'no-unused-vars': ['warn', { argsIgnorePattern: 'next|^_' }],
      'no-console': 'off',
      'no-constant-condition': 'warn',
    },
  },
];

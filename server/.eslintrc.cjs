module.exports = {
  root: true,
  env: { node: true, es2022: true },
  extends: ['eslint:recommended'],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'script' },
  ignorePatterns: ['node_modules', 'coverage'],
  rules: {
    'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
  },
  overrides: [
    {
      // Legacy CommonJS server, inherited from the university project. It trips
      // a handful of correctness rules (undefined identifiers, duplicate object
      // keys, self-assignment) that are tracked in PLAN.md Appendix B and fixed
      // by the Phase 2 rewrite. Exempting the old files here lets CI gate every
      // *new* file strictly instead of being permanently red.
      files: [
        'index.js',
        'controller/**/*.js',
        'middleware/**/*.js',
        'models/**/*.js',
        'routes/**/*.js',
        'scripts/generateTest*.js',
      ],
      rules: {
        'no-console': 'off',
        'no-dupe-keys': 'off',
        'no-inner-declarations': 'off',
        'no-self-assign': 'off',
        'no-undef': 'off',
        'no-unexpected-multiline': 'off',
        'no-unused-vars': 'off',
      },
    },
  ],
}

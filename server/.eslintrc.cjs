module.exports = {
  root: true,
  env: { node: true, es2022: true },
  extends: ['eslint:recommended'],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  ignorePatterns: ['node_modules', 'coverage'],
  rules: {
    'no-console': 'error',
    'no-unused-vars': ['error', { argsIgnorePattern: '^_', varsIgnorePattern: '^_' }],
  },
  overrides: [
    {
      // Legacy modules inherited from the university project, still mounted
      // while Phase 2 of PLAN.md replaces them one module at a time. They trip a
      // handful of correctness rules (undefined identifiers, duplicate object
      // keys, self-assignment) that are tracked in PLAN.md Appendix B. Exempting
      // the old files lets CI gate every *new* file strictly instead of being
      // permanently red. This block shrinks with each PR and disappears with the
      // last legacy file.
      files: [
        'controller/**/*.js',
        'middleware/requireAuth.js',
        'middleware/checkMember.js',
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

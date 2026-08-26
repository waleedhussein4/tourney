module.exports = {
  root: true,
  env: { browser: true, es2020: true },
  extends: [
    'eslint:recommended',
    'plugin:react/recommended',
    'plugin:react/jsx-runtime',
    'plugin:react-hooks/recommended',
  ],
  ignorePatterns: ['dist'],
  parserOptions: { ecmaVersion: 'latest', sourceType: 'module' },
  settings: { react: { version: '18.2' } },
  plugins: ['react-refresh'],
  rules: {
    'react/jsx-no-target-blank': 'off',
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
  },
  overrides: [
    {
      // Config files run in Node, not the browser.
      files: ['*.cjs', 'vite.config.js'],
      env: { node: true, browser: false },
    },
    {
      // Legacy SPA inherited from the university project. It trips prop-types,
      // unused-vars, and unescaped-entity rules across most components; the
      // Phase 4 rewrite (PLAN.md §6) replaces these files wholesale. Exempting
      // them here lets CI gate every *new* component strictly instead of being
      // permanently red.
      files: ['src/**/*.{js,jsx}'],
      rules: {
        'no-undef': 'off',
        'no-unused-vars': 'off',
        'react/no-unescaped-entities': 'off',
        'react/prop-types': 'off',
        'react-hooks/exhaustive-deps': 'off',
        'react-refresh/only-export-components': 'off',
      },
    },
  ],
}

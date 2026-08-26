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
    'no-console': 'error',
    'react/jsx-no-target-blank': 'off',
    // No TypeScript in this project by design, and prop-types on every component
    // is more ceremony than signal. Component contracts are documented with
    // JSDoc where they are not obvious from the call site.
    'react/prop-types': 'off',
    'react-refresh/only-export-components': ['warn', { allowConstantExport: true }],
  },
  overrides: [
    {
      // Config files run in Node, not the browser.
      files: ['*.cjs', 'vite.config.js'],
      env: { node: true, browser: false },
    },
    {
      // Legacy SPA inherited from the university project, being replaced page by
      // page. This list shrinks with every PR of the rewrite and goes away with
      // the last legacy file; everything outside it is linted strictly.
      files: [
        'src/App.jsx',
        'src/api/tournaments.js',
        'src/components/ConfirmationPopup.jsx',
        'src/pages/**/*.{js,jsx}',
      ],
      rules: {
        'no-console': 'off',
        'no-undef': 'off',
        'no-unused-vars': 'off',
        'react/no-unescaped-entities': 'off',
        'react-hooks/exhaustive-deps': 'off',
        'react-refresh/only-export-components': 'off',
      },
    },
  ],
}

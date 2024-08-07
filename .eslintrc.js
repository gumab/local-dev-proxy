module.exports = {
  ignorePatterns: ['**/dist/**/*'],
  root: true,
  env: {
    es6: true,
    node: true,
  },
  parserOptions: {
    ecmaVersion: 12,
  },
  extends: ['eslint:recommended', 'airbnb', 'prettier'],
  plugins: ['prettier'],
  settings: {
    'import/resolver': {
      node: {
        extensions: ['.js', '.ts'],
      },
      typescript: {},
    },
  },
  rules: {
    'consistent-return': 'off',
    'dot-notation': 'off',
    'func-names': 'off',
    'import/extensions': [
      'error',
      'ignorePackages',
      {
        ts: 'never',
        js: 'never',
      },
    ],
    'import/order': 'warn',
    'import/prefer-default-export': 'off',
    'no-alert': 'off',
    'no-console': 'warn',
    'no-else-return': 'off',
    'no-nested-ternary': 'off',
    'no-plusplus': 'off',
    'no-promise-executor-return': 'off',
    'no-shadow': 'off',
    'no-undef': 'off',
    'no-unused-vars': 'off',
    'no-use-before-define': 'off', // 'react/prefer-stateless-function': 0,
    // 'react/jsx-one-expression-per-line': 0,
    'no-void': 'off',
    'prefer-destructuring': 'off',
  },
  overrides: [
    {
      files: ['**/*.ts'],
      parser: '@typescript-eslint/parser',
      parserOptions: {
        ecmaVersion: 12,
        sourceType: 'script',
      },
      extends: ['plugin:@typescript-eslint/recommended'],
      plugins: ['@typescript-eslint'],
    },
  ],
};

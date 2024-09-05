module.exports = {
  extends: ['@repo/eslint-config/library.js'],
  ignorePatterns: ['dist/**/*', '.eslintrc.js'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
  rules: {
    'no-console': 'off',
  },
};

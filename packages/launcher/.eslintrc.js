module.exports = {
  extends: ['@repo/eslint-config/library.js'],
  ignorePatterns: ['dist/**/*', '.eslintrc.js', '@types/**/*'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
};

module.exports = {
  ignorePatterns: ['dist/**/*', '.eslintrc.js', '@types/**/*'],
  parserOptions: {
    project: './tsconfig.json',
    tsconfigRootDir: __dirname,
  },
};

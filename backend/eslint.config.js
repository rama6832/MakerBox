const js = require('@eslint/js');
const eslintConfigPrettier = require('eslint-config-prettier');

module.exports = [
  js.configs.recommended,
  {
    languageOptions: {
      globals: {
        require: 'readonly',
        module: 'readonly',
        exports: 'readonly',
        __dirname: 'readonly',
        process: 'readonly',
        console: 'readonly',
        jest: 'readonly',
        describe: 'readonly',
        test: 'readonly',
        expect: 'readonly',
        beforeEach: 'readonly',
        afterEach: 'readonly',
      },
    },
    rules: {
      'no-unused-vars': 'warn',
      'no-console': 'off',
      camelcase: ['error', {properties: 'never'}],
    },
  },
  eslintConfigPrettier,
];

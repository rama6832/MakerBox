const js = require('@eslint/js');

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
      'camelcase': ['error', {properties: 'never'}],
      'object-curly-spacing': ['error', 'never'],
      'semi': ['error', 'always'],
      'quotes': ['error', 'single'],
      'no-trailing-spaces': 'error',
      'eol-last': ['error', 'always'],
    },
  },
];

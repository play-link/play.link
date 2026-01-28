import antfu from '@antfu/eslint-config';

export default antfu({
  formatters: false,
  react: true,

  stylistic: false,

  // override your settings
  rules: {
    'jsonc/sort-keys': 'off',
    'no-console': 'off',
    'perfectionist/sort-imports': 'off',
    'react-hooks/exhaustive-deps: ["warn"]': 'off',
    'react/no-children-to-array': 'off',
    'ts/consistent-type-definitions': 'off',
    'ts/no-use-before-define': 'off',
  },
});

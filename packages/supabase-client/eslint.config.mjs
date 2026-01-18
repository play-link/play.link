import antfu from '@antfu/eslint-config';

export default antfu({
  stylistic: false,
  rules: {
    'no-console': 'off',
    'perfectionist/sort-imports': 'off',
    'ts/consistent-type-definitions': 'off',
  },
});

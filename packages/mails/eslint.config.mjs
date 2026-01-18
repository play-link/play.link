import antfu from '@antfu/eslint-config';

export default antfu({
  react: true,
  stylistic: false,
  rules: {
    'no-console': 'off',
    'ts/consistent-type-definitions': 'off',
  },
});

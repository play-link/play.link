import antfu from '@antfu/eslint-config'

export default antfu({
  react: true,
  stylistic: false,
  rules: {
    'jsonc/sort-keys': 'off',
    'no-console': 'off',
    'perfectionist/sort-imports': 'off',
    'react/no-children-to-array': 'off',
    'ts/consistent-type-definitions': 'off',
    'ts/no-use-before-define': 'off',
  },
})

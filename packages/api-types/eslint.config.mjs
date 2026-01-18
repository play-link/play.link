import antfu from '@antfu/eslint-config'

export default antfu({
  typescript: true,
  stylistic: false,
  rules: {
    'perfectionist/sort-imports': 'off',
  },
})

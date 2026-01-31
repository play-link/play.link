import antfu from '@antfu/eslint-config';

export default antfu({
  react: true,
  stylistic: false,
  rules: {
    'jsonc/sort-keys': 'off',
    'no-console': 'off',
    'perfectionist/sort-imports': 'off',
    'react-hooks/exhaustive-deps: ["warn"]': 'off',
    'react/no-children-to-array': 'off',
    'react-hooks/refs': 'off',
    'react-refresh/only-export-components': ['error', {allowExportNames: ['meta', 'loader', 'action', 'headers']}],
    'ts/consistent-type-definitions': 'off',
    'ts/no-use-before-define': 'off',
  },
});

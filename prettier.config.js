module.exports = {
  plugins: ['@trivago/prettier-plugin-sort-imports'],
  arrowParens: 'always',
  bracketSpacing: false,
  printWidth: 80,
  semi: false,
  singleQuote: true,
  tabWidth: 2,
  trailingComma: 'all',
  importOrderSeparation: false,
  importOrderSortSpecifiers: true,
  importOrder: ['<THIRD_PARTY_MODULES>', '^@play/(.*)$', '^[./]'],
}

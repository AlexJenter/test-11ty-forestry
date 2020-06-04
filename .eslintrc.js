const prettierConfig = require('./package.json').prettier

module.exports = {
	parser: 'babel-eslint',
	parserOptions: {
		sourceType: 'module',
		allowImportExportEverywhere: true,
	},
	env: {
		browser: true,
		node: true,
		es6: true,
	},

	plugins: ['prettier', 'eslint-plugin-import'],
	extends: ['eslint:recommended', 'prettier'],
	rules: {
		'prettier/prettier': ['error', Object.assign({}, prettierConfig)],
	},
	settings: {
		'import/resolver': {
			node: {
				extensions: ['.js', '.es6', '.jsx'],
				moduleDirectory: ['node_modules', 'source/_scripts', 'tmp/_scripts'],
			},
		},
	},
}

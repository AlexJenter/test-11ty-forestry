module.exports = {
	extends: ['stylelint-config-standard-scss', 'stylelint-prettier/recommended'],
	plugins: ['stylelint-prettier'],
	rules: {
		'prettier/prettier': true,
		'no-descending-specificity': null,
	},
}

module.exports = config => {
	const BetterPug = require('./plugins/BetterPug')
	const ErrorOverlay = require('./plugins/eleventy-plugin-error-overlay')

	config.addPlugin(BetterPug)
	config.addPlugin(ErrorOverlay)

	config.addPassthroughCopy({ 'source/_public': './' })

	config.setBrowserSyncConfig({
		...config.browserSyncConfig,
		files: ['build/**/*'],
		open: true,
	})

	config.setDataDeepMerge(true)

	return {
		dir: {
			input: 'source',
			output: 'build',
			includes: '_components',
			layouts: '_layouts',
			helpers: '_helpers',
		},
	}
}

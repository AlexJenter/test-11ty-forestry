module.exports = (config) => {
	const BetterPug = require('./plugins/BetterPug')

	config.addPlugin(BetterPug)

	config.addPassthroughCopy({ 'source/_public': './' })

	config.setBrowserSyncConfig({
		files: ['dist/**/*'],
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

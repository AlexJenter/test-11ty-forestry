const externalCommand = require('./util/externalCommand')
const serverport = require('./util/serverport')

module.exports.serve = function (done) {
	const cmd = externalCommand(
		'eleventy',
		'--serve --port ' + serverport,
		done,
		'Eleventy Server'
	)

	cmd.stdout.on('data', (data) => {
		if (data.indexOf('== Inspect your site configuration at') !== -1) {
			// middleman started

			if (done && typeof done === 'function') {
				console.log('eleventy is serving')
				done()
			}
		}
	})
}

module.exports.watch = function (done) {
	const cmd = externalCommand('eleventy', '--watch', done, 'Eleventy Watch')

	cmd.stdout.on('data', (data) => {
		if (data.indexOf('== Inspect your site configuration at') !== -1) {
			// middleman started

			if (done && typeof done === 'function') {
				console.log('eleventy is watching')
				done()
			}
		}
	})
}

module.exports.build = function (done) {
	process.env.NO_CONTRACTS = 'true'
	externalCommand('eleventy', '', done, 'Eleventy Build')
}

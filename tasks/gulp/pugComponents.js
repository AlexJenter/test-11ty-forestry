const sources = ['source/_components/**/[A-Z]*.pug', '!source/_components/layout/**/*.pug']

module.exports = function(done) {
	const glob = require('globby')
	const mkpath = require('mkpath')
	const Path = require('path')
	const FS = require('fs')

	mkpath.sync('source/_components')

	const all = glob
		.sync(sources)
		.map(srcPath => {
			return `include /${Path.relative('source/_components', srcPath)}`
		})
		.sort()

	FS.writeFileSync('source/_components/all.pug', all.join('\n'))
	done()
}

module.exports.sources = sources

module.exports = function(done) {
	const rimraf = require('rimraf')

	;['source/_public/css', 'source/_public/js'].forEach(dir => {
		rimraf.sync(dir)
	})

	done()
}

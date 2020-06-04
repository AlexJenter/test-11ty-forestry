const externalCommand = require('./util/externalCommand');

module.exports = function(done) {
	// we could very well use https://github.com/leidottw/gulp-pngquant
	// for that task -- but our linux build server seems to have problems
	// dealing with the pngquant-bin npm module.

	externalCommand('npm', 'run postbuild:img', done, 'Image Optimization');
};

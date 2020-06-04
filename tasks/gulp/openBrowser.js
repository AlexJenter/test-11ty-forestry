const gulp = require('gulp');
const open = require('gulp-open');
const serverport = require('./util/serverport');

module.exports = function() {
	return gulp.src(__filename).pipe(
		open({
			uri: 'http://localhost:' + serverport
		})
	);
};

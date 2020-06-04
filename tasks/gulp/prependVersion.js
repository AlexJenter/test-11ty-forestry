const gulp = require('gulp');

function prependVersion() {
	const through = require('through2');
	const duration = require('./util/logDuration');
	const dateString = new Date().toISOString().split('T')[0];

	console.log('➿  Prepending version with ' + dateString + '....');

	return gulp
		.src(['build/**/*.js', 'build/**/*.css'])
		.pipe(
			through.obj('dummy', function(file, enc, cb) {
				const dateLine = Buffer.from(
					'/** @license HV v. ' + dateString + ' **/\n\n',
					'utf8'
				);
				file.contents = Buffer.concat([dateLine, file.contents]);
				cb(null, file);
			})
		)
		.pipe(gulp.dest('build'))
		.pipe(duration('⚡️  Versioning'));
}

module.exports = prependVersion;

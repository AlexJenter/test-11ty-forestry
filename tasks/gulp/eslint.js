const gulp = require('gulp');
const gulpIf = require('gulp-if');

function watch(location) {
	const changedFiles = new Set();
	let changedTimeout;

	gulp.watch(location).on('all', (type, filepath) => {
		if (type !== 'deleted') {
			changedFiles.add(filepath);
		}
		clearTimeout(changedTimeout);
		changedTimeout = setTimeout(() => {
			lint([...changedFiles]);
			changedFiles.clear();
		}, 20);
	});
}

function isFixed(file) {
	return file.eslint != null && file.eslint.fixed;
}

function isNotFixed(file) {
	return !isFixed(file);
}

function lint(files) {
	const eslint = require('gulp-eslint');
	return gulp
		.src(files, { base: './' })
		.pipe(eslint({ fix: true }))
		.pipe(gulpIf(isNotFixed, eslint.format()))
		.pipe(gulpIf(isFixed, gulp.dest('./')));
}

module.exports = watch;
module.exports.lint = lint;

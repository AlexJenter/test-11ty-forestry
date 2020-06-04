const gulp = require('gulp');

module.exports = function() {
	const htmlmin = require('gulp-htmlmin');

	return gulp
		.src('build/pages/**/*.html')

		.pipe(
			htmlmin({
				collapseWhitespace: true,
				conservativeCollapse: true,
				minifyJS: true,
				minifyCSS: true
			})
		)

		.pipe(gulp.dest('build/pages'));
};

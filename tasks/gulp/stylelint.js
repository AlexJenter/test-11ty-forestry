const gulp = require('gulp');

function watch(location) {
	const gulpIf = require('gulp-if');
	const stylelint = require('stylelint');
	const Through = require('through2');
	const chalk = require('chalk');

	let changedFiles = new Set(),
		changedTimeout;

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

	function isFixed(file) {
		return !!file.lintFixed;
	}

	function lint(files) {
		return (
			gulp
				.src(files, { base: './' })
				// remove some content to ease diffing
				.pipe(
					Through.obj(function(file, enc, cb) {
						const contents = file.contents.toString(enc);

						stylelint
							.lint({
								code: contents,
								fix: true,
								formatter: 'string',
								cache: true,
								syntax: 'scss'
							})
							.then(result => {
								console.log(chalk.underline(file.path));
								if (result.output !== contents) {
									console.log(chalk.yellow('Fixed CSS'));
									file.lintFixed = true;
									file.contents = Buffer.from(result.output, enc);
								} else {
									if (result.errored) {
										result.results.forEach(r => {
											r.warnings.forEach(warning => {
												console.log(
													`${
														warning.severity === 'error'
															? chalk.red(warning.severity)
															: chalk.yellow(warning.severity)
													}: ${warning.text}`
												);
											});
										});
									} else {
										console.log(chalk.green('✅ Alright now.'));
									}
								}

								cb(null, file);
							});
					})
				)
				.pipe(gulpIf(isFixed, gulp.dest('./')))
		);
	}
}

module.exports = watch;

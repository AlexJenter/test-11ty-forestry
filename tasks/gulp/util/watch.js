function watch(location, action, options = {}) {
	const gulp = require('gulp');
	const path = require('path');
	const chalk = require('chalk');
	const config = require('./config');
	let changedFiles = [],
		changedTimeout;

	gulp.watch(location).on('all', (type, filepath) => {
		const relPath = path.relative(path.join(config.root, 'source'), filepath);
		changedFiles.push({
			path: relPath,
			type
		});
		clearTimeout(changedTimeout);
		changedTimeout = setTimeout(() => {
			let fileMessage = `${changedFiles.length} files ${chalk.green('changed')}`;
			if (changedFiles.length === 1) {
				fileMessage = `${changedFiles[0].path}: ${chalk.green(changedFiles[0].type)}`;
			}
			console.log(`👀  ${fileMessage} 👉🏻  ${chalk.bgBlack.white(action)}`);
			changedFiles = [];
			gulp.series(action)();
		}, options.delay || 50);
	});
}

module.exports = watch;

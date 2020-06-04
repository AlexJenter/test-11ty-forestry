const gulp = require('gulp');

function addComponents() {
	const rimraf = require('rimraf');
	const through = require('through2');
	const path = require('path');
	const createComponent = require('../add-component');
	const chalk = require('chalk');

	return gulp
		.src('source/components/**/*.new')
		.pipe(
			through.obj('dummy', function(file, enc, cb) {
				const componentPath = path.relative(file.base, file.path).replace(/\.new$/, '');
				if (createComponent.validate(componentPath)) {
					createComponent(componentPath);
					console.log('✅  Added component «' + componentPath.split('/').pop() + '»');
				} else {
					console.log(
						'🚨  ' +
							chalk.red('«' + componentPath.split('/').pop() + '» already exists.')
					);
					require('node-notifier').notify({
						title: '«' + componentPath.split('/').pop() + '» already exists.'
					});
				}
				cb(null, file);
			})
		)
		.on('end', function() {
			rimraf.sync('source/components/**/*.new');
		});
}

module.exports = addComponents;

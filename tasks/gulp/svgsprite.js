const gulp = require('gulp');

/*
	We collect all svg files in source/assets/img/svg/,
	optimize them with svgo,
	read them, parse their size and merge all data into
	a json file (data/sprite.json) for middleman
	(middleman will create the actual sprite svg based on that).
	We also create a scss file with the size of the icons,
	based on the template in tasks/templates/svgsprite.scss
*/

module.exports = function() {
	const svgmin = require('./util/gulp-svgo');
	const reduce = require('gulp-reduce-file');
	const path = require('path');
	const touch = require('./util/touch');
	const change = require('gulp-change');
	const ejs = require('ejs');
	const config = require('./util/config');
	const fs = require('fs');
	const rename = require('gulp-rename');

	function collect(file, collection) {
		const name = path.basename(file.path, '.svg');
		let content = file.contents.toString('utf8');
		try {
			const width = content.match(/<svg[^>]+width="(\d+)"/)[1];
			const height = content.match(/<svg[^>]+height="(\d+)"/)[1];
			content = content.replace(/ fill=".+?"/g, '');
			collection[name] = {
				name: name,
				width: parseInt(width, 10),
				height: parseInt(height, 10),
				content: content
			};
		} catch (error) {
			console.error('🚨  SVG Sprite could not process «' + name + '»: ' + error.toString());
		}
		return collection;
	}
	function end(collection) {
		return collection;
	}

	const template = fs
		.readFileSync(path.join(config.root, 'tasks/templates/svgsprite.scss'))
		.toString();

	return gulp
		.src('source/assets/img/svg/*.svg')
		.pipe(
			svgmin({
				plugins: [
					{ removeViewBox: false },
					{
						convertPathData: {
							floatPrecision: 4
						}
					}
				]
			})
		)
		.pipe(reduce('sprite.json', collect, end, {}))
		.pipe(gulp.dest('data'))
		.pipe(touch())
		.pipe(
			change(function(content) {
				const data = JSON.parse(content);
				return ejs.render(template, { data: data }, { delimiter: ':' });
			})
		)
		.pipe(
			rename({
				dirname: '',
				basename: '_sprite-settings',
				extname: '.scss'
			})
		)
		.pipe(gulp.dest('source/components/bootstrap/base/picto'))
		.on('end', function() {
			console.log('✅  SVG Sprite');
		});
};

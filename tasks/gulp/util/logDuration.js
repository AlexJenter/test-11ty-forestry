/** from https://github.com/hughsk/gulp-duration **/

const pretty = require('pretty-hrtime');
const through = require('through2');
const chalk = require('chalk');

module.exports = duration;

function duration(name, options) {
	let start = process.hrtime();
	const stream = through.obj({
		objectMode: true
	});

	stream.start = resetStart;

	name = name || 'gulp-duration';
	name = '' + name + ': ';

	return stream.once('end', function() {
		const time = pretty(process.hrtime(start));

		log(name + chalk.magenta(time));
	});

	function resetStart() {
		start = process.hrtime();
	}

	function log(str) {
		console.log(str);
	}
}

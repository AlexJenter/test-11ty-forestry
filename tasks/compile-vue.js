#!/usr/bin/env node

const VueCompiler = require('vue-template-compiler');
const hash = require('string-hash');
const mkpath = require('mkpath');
const Path = require('path');
const FS = require('fs');

const TMP_DIR = '/tmp';

let data = '';
const args = {};

process.argv.forEach(val => {
	const argMatch = val.match(/^--(\w+)=(.+)$/);
	if (argMatch) {
		args[argMatch[1]] = argMatch[2];
	}
});

process.stdin.resume();
process.stdin.setEncoding('utf8');

process.stdin.on('data', function(chunk) {
	data += chunk;
});

process.stdin.on('end', function() {
	getCompiled(data);
});

function getCompiled(data) {
	const ref = args.ref ? args.ref.replace(/\W/g, '-') : 'unknown';
	const hashedKey = `${ref}-${hash(data)}`;
	const cachePath = Path.join(TMP_DIR, 'vue', hashedKey + '.pug');
	if (FS.existsSync(cachePath)) {
		console.log(FS.readFileSync(cachePath).toString());
	} else {
		mkpath.sync(Path.dirname(cachePath));
		FS.writeFileSync(cachePath, compile(data));
	}
}

function compile(data) {
	const compiled = VueCompiler.compile(data.toString());
	let str;
	if (compiled.errors && compiled.errors.length) {
		console.error(
			'Errors compiling vue template:\n\n' + data + '\n\n',
			compiled.errors.join('\n\n')
		);
	}

	const stringExtractor = new StringExtractor();
	compiled.render = stringExtractor.process(compiled.render);
	compiled.staticRenderFns = compiled.staticRenderFns.map(function(fnBody) {
		return stringExtractor.process(fnBody);
	});

	str =
		'{ render: ' +
		wrapFunction(compiled.render, stringExtractor.get()) +
		', staticRenderFns: [' +
		compiled.staticRenderFns
			.map(function(fnBody) {
				return wrapFunction(fnBody);
			})
			.join(', ') +
		'] }';

	console.log(str);
	return str;
}

function StringExtractor() {
	const strings = [],
		lookup = {};
	this.process = function(fnBody) {
		fnBody = fnBody.replace(/\[\[(.+?)\]\]/g, function(match, str) {
			if (!lookup[str]) {
				lookup[str] = strings.length;
				strings.push(str);
			}
			return '"+$TRING$[' + lookup[str] + ']+"';
		});
		return fnBody;
	};
	this.get = function() {
		return strings;
	};
}

function wrapFunction(fnBody, strings) {
	if (strings && strings.length) {
		fnBody = fnBody.replace(/""\+/g, '').replace(/\+""/g, '');
		return (
			'function() {\nthis.$TRING$ = [\n' +
			strings
				.map(function(str) {
					return '"' + str + '"';
				})
				.join(',\n') +
			'\n];\n' +
			fnBody +
			'}'
		);
	} else {
		return 'function() { ' + fnBody + ' }';
	}
}

const gulp = require('gulp')

module.exports = function() {
	const reduce = require('gulp-reduce-file')
	const ejs = require('ejs')
	const mkpath = require('mkpath')
	const Path = require('path')
	const FS = require('fs')
	const config = require('./util/config')

	const basePath = Path.join(config.root, 'source/_scripts/')

	const chunks = {}

	function collect(file, collection) {
		const parser = /^\s*\*\s*@([\w_]+)\s+(.+)$/gm
		const content = file.contents.toString('utf8')
		const result = {}
		let parsed
		while ((parsed = parser.exec(content))) {
			result[parsed[1]] = parsed[2]
		}
		if (
			((result.status && result.status !== 'disabled') || result.enabled == 'true') &&
			result.selector
		) {
			result.path = Path.relative(basePath, file.path).replace(/\.js$/, '')
			result.name = Path.basename(file.path, '.js')
			result.name = result.name.replace('.es6', '')
			result.external = false
			if (result.chunk) {
				if (!chunks[result.chunk]) {
					chunks[result.chunk] = []
				}
				chunks[result.chunk].push(result)
			}
			collection.push(result)
		}
		if (!result.priority) {
			result.priority = 0
		}
		return collection
	}
	function end(collection) {
		collection.sort(sortByPath)
		Object.keys(chunks).forEach(key => {
			const chunk = chunks[key].sort(sortByPath)
			const template = FS.readFileSync(
				Path.join(config.root, 'tasks/templates/chunk.js')
			).toString()
			const path = `source/_scripts/app/chunks/${key}.js`
			const chunkJS = ejs.render(template, { modules: chunk }, { delimiter: ':' })
			mkpath.sync(Path.dirname(path))
			FS.writeFileSync(path, chunkJS)
			chunk.forEach(module => {
				module.chunkPath = `./chunks/${key}.js`
			})
		})
		const template = FS.readFileSync(
			Path.join(config.root, 'tasks/templates/modules.js')
		).toString()
		return ejs.render(
			template,
			{
				modules: collection,
			},
			{
				delimiter: ':',
			}
		)
	}

	function sortByPath(a, b) {
		if (a.path < b.path) {
			return -1
		}
		if (a.path > b.path) {
			return 1
		}

		// names must be equal
		return 0
	}

	return gulp
		.src('source/_scripts/app/modules/**/*.js')
		.pipe(reduce('modules.js', collect, end, []))
		.pipe(gulp.dest('source/_scripts/app'))
		.on('end', () => {
			console.log('✅  JS Modules')
		})
}

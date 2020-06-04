/* eslint-disable no-useless-escape */
const gulp = require('gulp')

const sassCache = {}

const dev = !(process.env.NODE_ENV === 'production')

module.exports = function(cb) {
	const sass = require('gulp-sass')
	const importer = require('node-sass-globbing')
	const postcss = require('gulp-postcss')
	const autoprefixer = require('autoprefixer')
	const cleanMediaQueries = require('./util/postcss-clean-mediaquery')
	const mergeDuplicates = require('./util/postcss-merge-duplicates')
	const cssnano = require('cssnano')
	const filter = require('gulp-filter')
	const rename = require('gulp-rename')
	const duration = require('./util/logDuration')
	// const browserSync = require('./browsersync').get()
	const touch = require('./util/touch')
	const Through = require('through2')

	let stream = gulp.src('source/_styles/!(_)*.scss', { base: 'source/_styles' })

	stream = stream
		.pipe(
			sass({
				importer: importer, // use globbing import
				outputStyle: 'compact',
				includePaths: ['source/_styles/', 'source/components/'],
			}).on('error', function(error) {
				const chalk = require('chalk')
				console.log('🚨  ' + chalk.red.bold('SASS Error:'))
				console.log(chalk.red(error.message.replace(/\t/g, ' ')))
				try {
					const messageLines = error.message.split('\n')
					messageLines.shift()
					require('node-notifier').notify({
						title: messageLines.shift(),
						message: messageLines.join('\n'),
						wait: true,
					})
				} catch (e) {
					// ignore error
				}
			})
		)

		// only continue expensive postcss processing if sass result has changed
		.pipe(
			filter(function(file) {
				const content = file.contents.toString()
				if (sassCache[file.path] !== content) {
					sassCache[file.path] = content
					return true
				} else {
					return false
				}
			})
		)

	const postCSSPlugins = [
		cleanMediaQueries(),
		mergeDuplicates(),
		autoprefixer({
			// browsers: see package.json > browserlist
			flexbox: 'no-2009',
			cascade: false,
		}),
	]
	const cssNanoPlugin = cssnano({
		preset: 'default',
	})
	const haveLines = Through.obj((file, enc, cb) => {
		let contents = file.contents.toString('utf8')
		// relative to absolute paths
		contents = contents.replace(/\}([\w\.\#@:\[])/g, '}\n$1')
		file.contents = Buffer.from(contents, 'utf8')
		cb(null, file)
	})
	const debugSize = filter(function(file) {
		const content = file.contents.toString()
		const binaryString = require('pako').deflate(content, { to: 'string' })
		console.log(
			'✅ ',
			file.path.split('/').pop() +
				' (' +
				countSelectors(content) +
				' selectors / ' +
				(content.length / 1024).toFixed(1) +
				'K / GZip ' +
				(binaryString.length / 1024).toFixed(1) +
				'K)'
		)
		return true
	})
	const absPathForAboveFold = Through.obj(function(file, enc, cb) {
		if (file.path.indexOf('-abovefold') >= 0) {
			console.log('rel to abs')
			let contents = file.contents.toString('utf8')

			// relative to absolute paths
			contents = contents.replace(/url\(("?)\.\.\//g, 'url($1/assets/')

			file.contents = Buffer.from(contents, 'utf8')
		}
		cb(null, file)
	})

	stream = stream.pipe(postcss(postCSSPlugins))

	stream = stream.pipe(absPathForAboveFold)

	let finalStream = stream
	if (!dev) {
		finalStream = finalStream.pipe(postcss([cssNanoPlugin]))
	}
	finalStream
		.pipe(haveLines)
		.pipe(debugSize)
		.pipe(gulp.dest('tmp'))
		.pipe(touch())

	// if (dev) {
	// 	// stream to browserSync if browserSync is running
	// 	finalStream = finalStream.pipe(browserSync.stream({ match: '**/*.css' }))
	// }

	stream = stream
		.pipe(gulp.dest('source/_public/assets/css'))
		.pipe(touch())
		.pipe(duration('⚡️  CSS'))

	return stream
}

function countSelectors(content) {
	try {
		let count = 0
		const processed = content.replace(/\s/g, '').replace(/\/\*.+?\*\//g, '') // remove whitespace, remove comments
		const r = /[\}\{]([^@0-9\}\{][^\{\}]+)\{/gm
		let match
		while ((match = r.exec(processed))) {
			count += match[1].split(',').length
		}
		return count
	} catch (err) {
		return -1
	}
}

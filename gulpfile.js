const gulp = require('gulp')
const tasks = require('./tasks/gulp')

const { config } = tasks.util
config.root = __dirname
config.source = 'source'
config.dst = 'source'

gulp.task('set-prod-node-env', (cb) => {
	process.env.NODE_ENV = 'production'
	cb()
})
for (const i in tasks) {
	if (typeof tasks[i] === 'function') {
		gulp.task(i, tasks[i])
	}
}
gulp.task('eleventy:serve', tasks.eleventy.serve)
gulp.task('eleventy:build', tasks.eleventy.build)

gulp.task('watch', () => {
	const { watch } = tasks.util
	watch('source/**/*.scss', 'sass')
	watch('source/_data/colors/*.yml', 'colors')
	// watch(['source/_public/img/svg/*.svg', 'tasks/templates/svgsprite.scss'], 'svgsprite')
	// watch(
	// 	['assets/icons/**/*.svg', 'source/_data/colors.yml', 'source/_data/colorsDark.yml'],
	// 	'svg2icon'
	// )
	watch(
		[
			'source/_scripts/**/*.js',
			'!source/_scripts/app/chunks/*.js',
			'!source/_scripts/app/modules.js',
			'tasks/templates/*.js',
		],
		'js',
		{ delay: 150 }
	)
	const addWatcher = gulp.watch('source/_components/**/*.new')
	addWatcher.on('addDir', gulp.series('addComponents'))
	addWatcher.on('add', gulp.series('addComponents'))
	const renameWatcher = gulp.watch('source/_components/**/*')
	renameWatcher.on('addDir', tasks.renameComponent.add)
	renameWatcher.on('unlinkDir', tasks.renameComponent.unlink)
	watchLint()
})

function watchLint() {
	tasks.eslint(['**/*.js'])
	tasks.stylelint(['source/**/*.scss'])
}

gulp.task('lint', watchLint)
gulp.task('eslint', () => {
	return tasks.eslint.lint(['**/*.js'])
})

gulp.task('js', gulp.series('jsModules', 'jsConcat'))

gulp.task(
	'prebuild',
	gulp.parallel('colors', 'addComponents', 'js') //, 'svg2icon', 'svgsprite', 'jiraTasks')
)
gulp.task(
	'build',
	gulp.series(
		'set-prod-node-env',
		'clean',
		'prebuild',
		gulp.parallel('jsConcat', 'sass'),
		'eleventy:build',
		gulp.parallel('imageOptimize')
	)
)
gulp.task(
	'live',
	gulp.parallel(
		gulp.series('clean', 'prebuild', 'sass', 'watch'),
		gulp.series('eleventy:serve', 'openBrowser'),
		'browsersync'
	)
)

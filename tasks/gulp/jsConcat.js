const caches = {}

module.exports = function(cb) {
	console.log('✅  JS Rollup')
	const { rollup } = require('rollup')
	const buble = require('rollup-plugin-buble')
	const includePaths = require('rollup-plugin-includepaths')
	const commonjs = require('@rollup/plugin-commonjs')
	const nodeResolve = require('@rollup/plugin-node-resolve')
	const { terser } = require('rollup-plugin-terser')
	const replacePlugin = require('@rollup/plugin-replace')
	const svelte = require('rollup-plugin-svelte')
	const Colorize = require('ansi-colors')

	const dev = !(process.env.NODE_ENV === 'production')
	console.log('NODE_ENV:', process.env.NODE_ENV)
	const startTime = new Date()

	function getConfig(options) {
		const plugins = [
			replacePlugin({}),
			svelte({
				dev,
			}),
			nodeResolve({
				mainFields: ['module', 'jsnext:main', 'main', 'browser'],
				dedupe: importee => importee === 'svelte' || importee.startsWith('svelte/'),
			}),
			includePaths({
				paths: ['source/_scripts'],
				extensions: ['.js', '.es6'],
			}),
			commonjs({
				include: ['node_modules/**', 'source/_scripts/vendor/**'],
				sourceMap: false,
			}),
		]
		if (options.legacy) {
			plugins.push(
				buble({
					exclude: ['source/_scripts/vendor/**', 'node_modules/**'],
				})
			)
		}
		if (dev) {
			plugins.unshift({
				name: 'vue-runtime-resolver',
				resolveId(source) {
					if (source === 'vue/dist/vue.runtime.min') {
						return this.resolve('vue/dist/vue.runtime')
					}
					return null
				},
			})
		}
		if (!dev) {
			plugins.push(
				terser({
					compress: {
						drop_console: true,
					},
					warnings: true,
					sourcemap: dev,
				})
			)
		}

		const config = {
			input: 'source/_scripts/ui.js',
			plugins,
			treeshake: !dev,
			inlineDynamicImports: options.legacy,
			onwarn: warning => {
				if (warning.code !== 'EVAL' && warning.message.indexOf('ongenerate hook') === -1) {
					console.log(Colorize.red('Rollup Warning:', warning.code))
					console.log(warning.message)
					if (warning.loc) {
						console.log(`${warning.loc.file} ` + `#${warning.loc.line}`)
					}
				}
			},
			output: options.legacy
				? {
						format: 'iife',
						name: 'UI',
						file: dev
							? 'source/_public/assets/js/ui.js'
							: 'source/_public/assets/js/ui.min.js',
						strict: false,
						sourcemap: false,
				  }
				: {
						format: 'es',
						dir: 'source/_public/assets/js',
						entryFileNames: '[name].module.js',
						sourcemap: false,
				  },
		}

		return Object.assign({}, config, {
			cache: caches[options.key],
		})
	}

	const configs = {
		uiFallback: getConfig({
			key: 'uiFallback',
			legacy: true,
		}),
		uiModules: getConfig({
			key: 'ui',
			legacy: false,
		}),
	}

	function rollupConfig(configKey, rollupConfig) {
		return rollup(rollupConfig).then(
			bundle => {
				console.log(`Bundled ${configKey}`)
				caches[configKey] = bundle.cache
				if (Array.isArray(rollupConfig.output)) {
					console.log('Output is array')
					return rollupConfig.output.forEach(output => bundle.write(output))
				}
				return bundle.write(rollupConfig.output)
			},
			error => {
				const Colorize = require('ansi-colors')

				console.log(`🚨  ${Colorize.red.bold('JS Error:')}`)
				console.log(Colorize.red(error.message.replace(/\t/g, ' ')))
				console.log(error)

				try {
					require('node-notifier').notify({
						title: 'JS Error',
						message: error.message,
						wait: true,
					})
				} catch (e) {
					// nope
				}
			}
		)
	}

	return Promise.all([
		rollupConfig('uiFallback', configs.uiFallback),
		rollupConfig('uiModules', configs.uiModules),
	]).then(() => {
		console.log('⏱  JS Bundling took', Colorize.magentaBright(`${new Date() - startTime}ms`))
	})
}

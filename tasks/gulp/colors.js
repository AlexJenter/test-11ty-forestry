module.exports = function (done) {
	const yaml = require('js-yaml')
	const fs = require('fs')
	const glob = require('glob')
	const mkpath = require('mkpath')
	const Path = require('path')

	mkpath.sync('source/_styles/helpers/colors')

	const all = glob.sync('source/_data/colors/*.yml').map(function (srcPath) {
		const dstPath = srcPath
			.replace('source/_data/colors/', 'source/_styles/helpers/colors/_')
			.replace('.yml', '.scss')

		const doc = yaml.safeLoad(fs.readFileSync(srcPath, 'utf8'))
		let scss = '// Auto generated – modify ' + srcPath + '\n\n'
		for (const key in doc) {
			scss += '$c-' + key + ': ' + doc[key].toLowerCase() + ' !default;\n'
		}
		fs.writeFileSync(dstPath, scss)

		return [Path.basename(srcPath, '.yml'), doc]
	})

	;(function () {
		const dstPath = 'source/_styles/helpers/colors/_all.scss'
		let scss = '// Auto generated – modify source/_data/colors/*.yml' + '\n\n'

		const colorMaps = all
			.map(([name, colors]) => {
				const colorMap = Object.keys(colors)
					.map((key) => `\t\t${key}: ${colors[key].toLowerCase()}`)
					.join(',\n')
				return `\t${name}: (\n${colorMap}\n\t)`
			})
			.join(',\n')

		scss += `$colors: (\n${colorMaps}\n);`

		fs.writeFileSync(dstPath, scss)
	})()

	done()
}

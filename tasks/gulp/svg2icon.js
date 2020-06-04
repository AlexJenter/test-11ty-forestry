const Path = require('path')
const FS = require('fs')

module.exports = function (cb) {
	const svg2img = require('svg2img')
	const yaml = require('js-yaml')
	const mkpath = require('mkpath')
	const rimraf = require('rimraf')
	const ejs = require('ejs')

	const config = yaml.safeLoad(FS.readFileSync('source/_data/icons.yml', 'utf8'))

	const THEMES = [
		{
			name: 'normal',
			colorFile: 'source/_data/colors/normal.yml',
		},
		{
			name: 'dark',
			colorFile: 'source/_data/colors/dark.yml',
		},
		{
			name: 'meeting',
			colorFile: 'source/_data/colors/meeting.yml',
		},
		{
			name: 'meetingDark',
			colorFile: 'source/_data/colors/meetingDark.yml',
		},
	]

	THEMES.forEach((theme) => {
		theme.colors = yaml.safeLoad(FS.readFileSync(theme.colorFile, 'utf8'))
	})

	const template = FS.readFileSync(Path.join('tasks/templates/sprite/sprite.scss')).toString()
	const scss = ejs.render(
		template,
		{
			sprites: config,
		},
		{
			delimiter: ':',
		}
	)
	FS.writeFileSync('source/_styles/helpers/_icons.scss', scss)

	const conversions = {}

	Object.keys(config).forEach((category) => {
		const source = `assets/icons/${category}`
		const destination = `source/assets/img/icons/${category}`

		const icons = config[category]
		Object.keys(icons).forEach((iconName) => {
			const iconConf = icons[iconName]
			const svg = FS.readFileSync(Path.join(source, iconConf.source + '.svg')).toString()

			THEMES.forEach((theme) => {
				const destDirectory = theme.name ? destination + '-' + theme.name : destination
				rimraf.sync(destDirectory)

				const svgThemed = svg.replace(/#000000/g, theme.colors[iconConf.color])
				;[1, 2].forEach((res) => {
					const key = source + '--' + theme.name + 'x' + res
					conversions[key] = true
					svg2img(
						svgThemed,
						{
							width: iconConf.width * res,
							height: iconConf.height * res,
						},
						(error, buffer) => {
							const destPath = Path.join(destDirectory, res + 'x', iconName + '.png')
							mkpath.sync(Path.dirname(destPath))
							FS.writeFileSync(destPath, buffer)
							delete conversions[key]

							console.log(
								`${iconConf.source} -> ${iconConf.color} -> ${iconName} (${res}x)`
							)

							if (Object.keys(conversions).length === 0) {
								cb() // all done
							}
						}
					)
				})
			})
		})
	})
}

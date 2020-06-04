const ejs = require('ejs')

const fs = require('fs')
const path = require('path')
const mkpath = require('mkpath')

function createComponent(value) {
	const templateDir = path.join(__dirname, 'templates/component')
	const templates = fs.readdirSync(templateDir)
	const componentName = path.basename(value)
	const componentPath = value

	templates.forEach(function (file) {
		const destName = file.replace('component', componentName)
		const destPath = path.join(
			__dirname,
			'../source/_includes/components',
			componentPath
		)

		const template = fs
			.readFileSync(path.join(templateDir, file))
			.toString()
		const result = ejs.render(
			template,
			{
				name: componentName,
			},
			{
				delimiter: ':',
			}
		)

		mkpath.sync(destPath)
		fs.writeFileSync(path.join(destPath, destName), result)
	})
}

function validate(value) {
	const glob = require('glob')
	const components = glob
		.sync('source/_includes/components/**/_*.haml')
		.map(function (value) {
			const pathMatch = value.match(/.+\/([^/]+)\/_(.+)\.haml/)
			return pathMatch[1] === pathMatch[2] ? pathMatch[1] : false
		})
		.filter(function (value) {
			return !!value
		})
	if (components.indexOf(value.split('/').pop()) >= 0) {
		return false
	}
	return value
}

module.exports = createComponent
module.exports.validate = validate

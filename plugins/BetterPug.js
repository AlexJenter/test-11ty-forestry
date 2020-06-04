module.exports = (config) => {
	const pug = require('pug')
	const helpers = require('../source/_helpers')

	// config.setDynamicPermalinks(false)

	config.setLibrary('pug', {
		compile(str, options) {
			const render = pug.compile(str, options)

			const renderFunction = function (data) {
				const augmentedHelpers = {}
				const augmentedData = {}
				Object.keys(config.javascriptFunctions).forEach((name) => {
					const helper = config.javascriptFunctions[name]
					augmentedHelpers[name] = helper
				})
				Object.keys(helpers).forEach((name) => {
					const helper = helpers[name]
					augmentedHelpers[name] = function () {
						const args = []
						for (let i = 0; i < arguments.length; i++) {
							args.push(arguments[i])
						}
						return helper.apply(augmentedData, args)
					}
				})
				augmentedData.__locals = data
				Object.assign(augmentedData, augmentedHelpers, data)
				return render(augmentedData)
			}

			return renderFunction
		},
	})
}

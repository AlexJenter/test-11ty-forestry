const Path = require('path')

module.exports = function url_for(path) {
	var page = this.page
	var isAbsolute = path.charAt(0) === '/'
	if (isAbsolute) {
		const pageDirectory = page.url.match(/.*\//)[0]
		return Path.relative(pageDirectory, path)
	} else {
		return path
	}
}

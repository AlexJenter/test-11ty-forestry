module.exports = function(page) {
	page = page || this._page
	if (!page.url.match(/\/([^\/]+)\.\w+$/)) {
		console.log('no match', page.url)
	}
	return page.data.title || titleize(page.url.match(/\/([^\/]+)\.\w+$/)[1])
}

module.exports.titleize = titleize

function titleize(str) {
	return str
		.replace(/([a-z])([A-Z])/g, '$1 $2')
		.replace(/[\W_]+/g, ' ')
		.replace(/(^\w|\s\w)/g, function(s) {
			return s.toUpperCase()
		})
}

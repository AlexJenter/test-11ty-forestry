module.exports = function() {
	const sitemap = this.collections.all
	const tree = new Tree()
	var Path = require('path')
	function Tree() {
		Object.defineProperty(this, 'parent', {
			enumerable: false,
			configurable: false,
			writable: true,
			value: null,
		})
		Object.defineProperty(this, 'children', {
			enumerable: false,
			configurable: false,
			writable: true,
			value: [],
		})
		Object.defineProperty(this, 'descendants', {
			enumerable: false,
			configurable: false,
			writable: true,
			value: [],
		})
	}
	function category(path) {
		var node = tree
		var split = path.split('/')
		if (split[1] == 'components') split.pop() // ignore last directory
		split.forEach(function(dir) {
			if (dir) {
				if (!node[dir]) {
					node[dir] = new Tree()
					node[dir].parent = node
				}
				node = node[dir]
			}
		})
		return node
	}
	for (var file in sitemap) {
		var page = sitemap[file]
		var cat = category(Path.dirname(page.url))
		cat.children.push(page)
		while (cat) {
			cat.descendants.push(page)
			cat = cat.parent
		}
	}

	return tree
}

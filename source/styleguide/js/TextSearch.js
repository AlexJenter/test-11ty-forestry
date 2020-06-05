var styleguide = styleguide || {}
styleguide.search = (function() {
	function TextSearch() {}

	var DEFAULT_OPTIONS = {
		returnIndex: false,
	}

	TextSearch.getScores = function(text, needle, options) {
		options = $.extend({}, DEFAULT_OPTIONS, options)

		var result1 = []

		var score, i
		for (i = 0; i < text.length; i++) {
			score = find(text[i].toLowerCase(), needle.toLowerCase())
			if (score > 0) {
				result1.push({
					text: text[i],
					index: i,
					score: score,
				})
			}
		}

		function find(text, needle) {
			return text.indexOf(needle) >= 0
		}

		return result1
	}

	/**
	 * Searches an array of text for a series of character - kind of fuzzy like Sublime
	 * @param  {array}  text   Array of texts to search through
	 * @param  {string} needle String to search for
	 * @return {array}  Matching texts or indexes (returnIndex option) sorted by best match
	 */
	TextSearch.search = function(text, needle, options) {
		options = $.extend({}, DEFAULT_OPTIONS, options)

		var result1, result2, result3

		result1 = TextSearch.getScores(text, needle, options)

		result2 = result1.sort(function(a, b) {
			if (a.score < b.score) return 1
			if (a.score > b.score) return -1
			return 0
		})

		if (options.minScore) {
			result2 = result2.filter(function(item) {
				return item.score >= options.minScore
			})
		}

		result3 = []
		for (i = 0; i < result2.length; i++) {
			result3[i] = options.returnIndex ? result2[i].index : result2[i].text
		}
		return result3
	}

	return TextSearch
})()

if (typeof define === 'function' && define.amd) {
	define([], styleguide.search)
}

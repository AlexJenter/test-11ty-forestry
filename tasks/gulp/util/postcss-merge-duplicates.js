const postcss = require('postcss');

/*
 * cleans duplicate selectors that follow one another
 * a { color: black; }
 * a { padding: 10px; }
 * becomes
 * a { color: black; padding: 10px; }
 */
function mergeDuplicates(options) {
	return function(styles, result) {
		options = options || {};
		let removedCount = 0;

		// merge media queries
		styles.walkAtRules(function(rule) {
			let previousRule = rule.prev();
			if (
				previousRule &&
				rule.name === 'media' &&
				previousRule.name === rule.name &&
				previousRule.params === rule.params
			) {
				// console.log(rule.name, rule.params);
				previousRule.append(rule.nodes);
				rule.remove();
				removedCount++;
			}
			previousRule = rule;
		});

		// merge duplicate selectors
		styles.walkRules(function(rule) {
			let previousRule = rule.prev();
			if (
				previousRule &&
				previousRule.selector === rule.selector &&
				previousRule.parent === rule.parent
			) {
				// console.log(rule.selector);
				previousRule.append(rule.nodes);
				rule.remove();
				removedCount++;
			}
			previousRule = rule;
		});

		// console.log('Merged', removedCount, 'rules')
	};
}

module.exports = postcss.plugin('postcss-merge-duplicates', mergeDuplicates);

const postcss = require('postcss');

const minmaxMatch = /\(((min|max)\-(width|height)): (\d+)(\w+)\)/;

/*
 * cleans duplicate min or max media queries like
 * (min-width: 100px) and (min-width: 300px) -> (min-width: 300px)
 * also removes nonsense queries like
 * (min-width: 750px) and (max-width: 400px)
 *
 * These kind of mediaqueries can happen with SASS, when cascading mediaqueries:
 * @media (min-width: 100px) {
 * 	@media (min-width: 200px) {
 * 		display: none;
 * 	}
 * }
 */
function cleanMedia(options) {
	return function(styles, result) {
		options = options || {};
		const map = {};
		const toRemove = [];

		// read custom media queries
		styles.walkAtRules(function(rule) {
			if (rule.name !== 'media') {
				return;
			}

			let conditions = rule.params.split(/\s+and\s+/);
			const values = {};
			let dirty = false;
			if (conditions.length > 1) {
				conditions.forEach(function(condition, index) {
					const match = condition.match(minmaxMatch);
					if (match) {
						const value = {
							expression: match[0], // '(max-width: 1600px)'
							key: match[1], // min-width
							type: match[2], // min
							name: match[3], // width
							size: Number(match[4]), // 1600
							unit: match[5], // px
							index: index
						};
						const key = value.key;
						const existingValue = values[key];
						if (existingValue) {
							dirty = true;
							if (
								(value.type === 'max' && value.size > existingValue.size) ||
								(value.type === 'min' && value.size < existingValue.size)
							) {
								conditions[index] = false;
								return;
							} else {
								conditions[existingValue.index] = false;
							}
						}
						values[key] = value;
					}
				});
				if (dirty) {
					conditions = conditions.filter(function(condition) {
						return !!condition;
					});
				}
				if (conditions.length > 1) {
					// remove nonsense media rules like
					// (min-width: 750px) and (max-width: 400px)
					for (const i in values) {
						const value = values[i];
						if (value.type === 'min') {
							const maxValue = values['max-' + value.name];
							if (
								maxValue &&
								value.size > maxValue.size &&
								value.unit === maxValue.unit
							) {
								// console.log('!!! ', rule.params);
								rule.remove();
								return;
							}
						}
					}
				}
				if (dirty) {
					// console.log(rule.params, ' ----> ', conditions.join(' and '));
					rule.params = conditions.join(' and ');
				}
			}
		});
	};
}

module.exports = postcss.plugin('postcss-clean-mediaquery', cleanMedia);

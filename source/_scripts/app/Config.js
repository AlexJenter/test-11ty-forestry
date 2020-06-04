const defaultConfig = {
	root: location.href.substr(0, location.href.lastIndexOf('/') + 1)
};

const config = Object.assign({}, defaultConfig, typeof window !== 'undefined' && window.app_config);

/**
 * public API
 */
export default {
	get() {
		let result = config;

		try {
			for (let i = 0; i < arguments.length; i++) {
				result = result[arguments[i]];
			}
		} catch (e) {
			return undefined;
		}

		return result;
	},
	set(key, value) {
		config[key] = value;
		return value;
	}
};

const node = function(value) {
	return value !== undefined && value instanceof HTMLElement && value.nodeType === 1;
};

const nodeList = function(value) {
	var type = Object.prototype.toString.call(value);

	return (
		value !== undefined &&
		(type === '[object NodeList]' || type === '[object HTMLCollection]') &&
		'length' in value &&
		(value.length === 0 || node(value[0]))
	);
};

/**
 * Checks if value is either "document", "window" or "body (aka document.documentElement)"
 * @param  {[type]} value [description]
 * @return {[type]}       [description]
 */
const rootNode = function(value) {
	var type = Object.prototype.toString.call(value);

	return type === '[object HTMLHtmlElement]' || type === '[object Window]' || type === '[object HTMLDocument]';
};

const svg = function(value) {
	return value !== undefined && value instanceof SVGElement;
};

const object = function(value) {
	return Object.prototype.toString.call(value) === '[object Object]';
};

const string = function(value) {
	return typeof value === 'string' || value instanceof String;
};

const fn = function(value) {
	return Object.prototype.toString.call(value) === '[object Function]';
};

export default {
	node,
	nodeList,
	rootNode,
	svg,
	object,
	string,
	fn
};

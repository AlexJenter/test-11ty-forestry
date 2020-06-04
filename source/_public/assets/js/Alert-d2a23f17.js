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

var checkType = {
	node,
	nodeList,
	rootNode,
	svg,
	object,
	string,
	fn
};

/**
 * A polyfill for Element.matches()
 */
if (typeof Element !== 'undefined' && !Element.prototype.matches) {
	var proto = Element.prototype;

	proto.matches =
		proto.matchesSelector ||
		proto.mozMatchesSelector ||
		proto.msMatchesSelector ||
		proto.oMatchesSelector ||
		proto.webkitMatchesSelector;
}

/**
 * Polyfill for Element.closest()
 */
if (!Element.prototype.closest) {
	Element.prototype.closest = function(s) {
		var el = this;

		if (!document.documentElement.contains(el)) return null;

		do {
			if (el.matches(s)) return el;
			el = el.parentElement || el.parentNode;
		} while (el !== null && el.nodeType === 1);

		return null;
	};
}

let namespaces = {};

function getNamespace(ns) {
	if (!namespaces[ns]) {
		namespaces[ns] = {};
	}

	return namespaces[ns];
}

function getListenerOfSameTypeInNamespace(ns, type) {
	const namespace = getNamespace(ns);

	if (!namespace[type]) {
		namespace[type] = [];
	}

	return namespace[type];
}

function addListener(node, type, callback) {
	const startOfNs = type.indexOf('.');

	if (startOfNs !== -1) {
		let ns = type.substring(startOfNs, type.length);
		type = type.substring(0, startOfNs);

		let listenerInNamespace = getListenerOfSameTypeInNamespace(ns, type);

		listenerInNamespace.push({
			node: node,
			fn: callback
		});
	}

	return node.addEventListener(type, callback);
}

function removeListenersByNamespace(namespace) {
	let ns = getNamespace(namespace);

	for (let type in ns) {
		for (let i = 0; i < ns[type].length; i++) {
			let pair = ns[type][i];

			pair.node.removeEventListener(type, pair.fn);
		}
	}

	delete namespaces[namespace];
}

/**
 * Delegates event to a selector.
 *
 * @param {Element} element
 * @param {String} selector
 * @param {String} type
 * @param {Function} callback
 * @param {Boolean} useCapture
 * @return {Object}
 */
function _delegate(element, selector, type, callback, useCapture) {
	var listenerFn = listener.apply(this, arguments);

	addListener(element, type, listenerFn, useCapture);

	return {
		destroy: function() {
			element.removeEventListener(type, listenerFn, useCapture);
		}
	};
}

/**
 * Finds closest match and invokes callback.
 *
 * @param {Element} element
 * @param {String} selector
 * @param {String} type
 * @param {Function} callback
 * @return {Function}
 */
function listener(element, selector, type, callback) {
	return function(e) {
		e.delegateTarget = e.target.closest(selector);

		if (e.delegateTarget) {
			callback.call(element, e);
		}
	};
}

/**
 * Delegates event to a selector.
 *
 * @param {Element|String|Array} [elements]
 * @param {String} selector
 * @param {String} type
 * @param {Function} callback
 * @param {Boolean} useCapture
 * @return {Object}
 */
function delegate(elements, selector, type, callback, useCapture) {
	// Handle the regular Element usage
	if (typeof elements.addEventListener === 'function') {
		return _delegate.apply(null, arguments);
	}

	// Handle Element-less usage, it defaults to global delegation
	if (typeof type === 'function') {
		// Use `document` as the first parameter, then apply arguments
		// This is a short way to .unshift `arguments` without running into deoptimizations
		return _delegate.bind(null, document).apply(null, arguments);
	}

	// Handle Selector-based usage
	if (typeof elements === 'string') {
		elements = document.querySelectorAll(elements);
	}

	// Handle Array-like based usage
	return Array.prototype.map.call(elements, function(element) {
		return _delegate(element, selector, type, callback, useCapture);
	});
}

/**
 * Attaches am EventListener to a `Node`
 */
function onNode(node, type, callback) {
	addListener(node, type, callback);
}

/**
 * Attaches EventListener to all element in the `NodeList`
 */
function onNodeList(nodeList, type, callback) {
	for (var i = 0, len = nodeList.length; i < len; i++) {
		addListener(nodeList[i], type, callback);
	}
}

/**
 *
 */
function onSelector(selector, type, callback) {
	return delegate(document.body, selector, type, callback);
}

function onDelegated(element, type, selector, callback) {
	return delegate(element, selector, type, callback);
}

/**
 *
 */
function on() {
	const args = Array.prototype.slice.call(arguments); // copy arguments
	const target = args[0];

	if (args.length === 4) {
		return onDelegated.apply(this, args);
	} else {
		if (checkType.node(target) || checkType.rootNode(target)) {
			return onNode.apply(this, args);
		} else if (checkType.nodeList(target)) {
			return onNodeList.apply(this, args);
		} else if (checkType.string(target)) {
			return onSelector.apply(this, args);
		} else {
			throw new TypeError('First argument must be a String, HTMLElement, HTMLCollection, or NodeList');
		}
	}
}

var EventListener = {
	on: on,
	one: function() {
		for (var i = 0; i < arguments.length; i++) {
			let fn = arguments[i];

			if (checkType.fn(fn)) {
				let executeAndRemove = function(e) {
					fn.call(this, e);

					e.currentTarget.removeEventListener(e.type, executeAndRemove);
				};

				arguments[i] = executeAndRemove;
			}
		}

		on.apply(this, arguments);
	},
	off: function() {
		const args = Array.prototype.slice.call(arguments); // copy arguments

		removeListenersByNamespace(args[0]);
	},
	trigger: function(target, name, detail) {
		return target.dispatchEvent(
			new CustomEvent(name, {
				bubbles: true,
				cancelable: true,
				detail: detail
			})
		);
	}
};

/**
 * BaseModule
 */

const BaseModule = (function() {
	const namespaces = {};

	return class BaseModule {
		static ns(name) {
			if (!namespaces[name]) {
				namespaces[name] = 0;
			}

			return `.${name}${++namespaces[name]}`;
		}

		constructor() {
			this.el = null;

			this.ns = BaseModule.ns(this.constructor.name);
		}

		init(element) {
			this.el = element;

			return this;
		}

		static _getListenerArguments() {
			let event, selector, handler, target;

			let args = Array.prototype.slice.call(arguments); // copy arguments

			switch (arguments.length) {
				case 2:
					target = this.el;
					event = args.shift();
					handler = args.shift();
					break;
				case 3:
					event = args.shift();
					if (typeof event === 'string') {
						target = this.el;
						selector = args.shift();
						handler = args.shift();
					} else {
						target = event;
						event = args.shift();
						handler = args.shift();
					}
					break;
				case 4:
					target = args.shift();
					event = args.shift();
					selector = args.shift();
					handler = args.shift();
					break;
			}

			handler = this.bind(handler);

			event = event.replace(/(\s+|$)/g, `${this.ns}$1`);

			if (selector) {
				return [target, event, selector, handler];
			}

			return [target, event, handler];
		}

		// on(event, selector, handler)
		// on(element, event, selector, handler)
		// on(event, handler)
		// on(element, event, handler)
		on() {
			const args = BaseModule._getListenerArguments.apply(this, arguments);

			EventListener.on.apply(this.el, args);
		}

		one() {
			const args = BaseModule._getListenerArguments.apply(this, arguments);

			EventListener.one.apply(this.el, args);
		}

		trigger(...args) {
			args.unshift(this.el);

			EventListener.trigger.apply(this.el, args);
		}

		off() {
			EventListener.off(this.ns);

			if (this.nstemp) {
				EventListener.off(this.nstemp);
			}
		}

		destroy() {
			this.off();

			if (this.el) {
				// remove event listeners
				this.el = undefined;
			}
		}

		bind(method) {
			const self = this;

			return function() {
				method.apply(self, arguments);
			};
		}
	};
})();

/**
 * Alert
 *
 * @selector .js-Alert
 * @enabled true
 */

class Alert extends BaseModule {
	constructor() {
		super();
	}

	init(element) {
		this.el = element;

		this.one('click', () => console.log(this.ns, 'listen once'));

		this.on('mouseenter', () => console.log(this.ns, 'mouseenter'));

		this.on(window, 'resize', () => console.log(this.ns, 'onWindowResize'));
		this.on('click', '.js-Alert--inner', () => console.log(this.ns, '.js-Alert--inner'));
		this.on(document, 'click', '.js-Alert', () => console.log(this.ns, 'global delegate'));

		this.on('click', () => {
			console.log(this.ns, 'element handler');

			this.off(this.ns);

			console.log('goodbye');
		});

		return this;
	}
}

export default Alert;

import './closest';
import { addListener } from './NamespacedListeners';

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
export default function delegate(elements, selector, type, callback, useCapture) {
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

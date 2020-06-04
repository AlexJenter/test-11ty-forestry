import checkType from './checkType';
import delegate from './delegate';
import { addListener, removeListenersByNamespace } from './NamespacedListeners';

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

export default {
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

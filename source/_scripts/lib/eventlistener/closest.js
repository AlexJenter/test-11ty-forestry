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

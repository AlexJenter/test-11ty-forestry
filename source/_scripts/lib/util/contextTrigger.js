/*
 * contextTrigger
 *
 * Binds functions to a certain context that is defined by a DOM Element.
 *
 * Usage:
 *
 * contextTrigger.add( triggerSelector,callback );
 *
 *
 * ---------------------------------------------------------------------------
 *
 * Example:
 *
 * contextTrigger.add("#main", function(){
 *
 *  require(['uxui/util/Frameplayer'], function(F){
 *    console.log(F);
 *  });
 *
 * });
 *
 */
export default (() => {
	const contextTrigger = {
		events: []
	};

	function TriggerEvent(selector, callback) {
		this.selector = selector;
		this.callback = callback;
		this.processed = false;
	}

	contextTrigger.add = function(selector, callback) {
		contextTrigger.events.push(new TriggerEvent(selector, callback));
		contextTrigger.invalidate();
	};

	contextTrigger.remove = function(selector, callback) {
		for (let i = contextTrigger.events.length - 1; i >= 0; i--) {
			let evt = contextTrigger.events[i];

			if (evt.selector === selector && evt.callback === callback) {
				contextTrigger.events.splice(i, 1);
				return true;
			}
		}
		return false;
	};

	contextTrigger.invalidate = function() {
		if (contextTrigger.events.length) {
			if (!this.validationTimeout) {
				this.validationTimeout = setTimeout(() => {
					this.validationTimeout = null;
					checkForNewElements();
				}, 50);
			}
		}
	};

	contextTrigger.validate = function(rootEl) {
		let evt;
		let contextEls;
		rootEl = rootEl || document.body;

		let rootEls = rootEl instanceof Array ? rootEl : [rootEl];

		if (!rootEls.length) {
			return false;
		}

		let i, j, k, contextEl, foundInContext, foundElements;

		for (i = 0; i < contextTrigger.events.length; i++) {
			evt = contextTrigger.events[i];
			contextEls = evt.processed ? rootEls : [document.body]; // check all dom for newly added callbacks
			evt.processed = true;

			foundElements = [];
			for (j = 0; j < contextEls.length; j++) {
				contextEl = contextEls[j];
				foundInContext = contextEl.querySelectorAll(evt.selector);
				for (k = 0; k < foundInContext.length; k++) {
					foundElements.push(foundInContext[k]);
				}
			}
			for (j = 0; j < rootEls.length; j++) {
				contextEl = rootEls[j];
				if (matches(contextEl, evt.selector)) {
					foundElements.push(contextEl);
				}
			}

			for (j = 0; j < foundElements.length; j++) {
				contextEl = foundElements[j];
				if (!contextEl.contextTriggerProcessed) {
					evt.callback.call(contextEl, contextEl);
				}
			}
		}

		// mark items as processed
		for (i = 0; i < rootEls.length; i++) {
			contextEl = rootEls[i];
			contextEl.contextTriggerProcessed = true;
			foundInContext = contextEl.getElementsByTagName('*');
			for (k = 0; k < foundInContext.length; k++) {
				foundInContext[k].contextTriggerProcessed = true;
			}
		}
	};

	function matches(el, selector) {
		return (
			el.matches ||
			el.matchesSelector ||
			el.msMatchesSelector ||
			el.mozMatchesSelector ||
			el.webkitMatchesSelector ||
			el.oMatchesSelector
		).call(el, selector);
	}

	function checkNode(node, result) {
		if (!node.contextTriggerProcessed) {
			result.push(node);
		} else {
			let c = node.firstChild;

			while (c) {
				if (c.nodeType === 1) {
					checkNode(c, result);
				}

				c = c.nextSibling;
			}
		}
	}

	let all = document.body.getElementsByTagName('*');

	function checkForNewElements() {
		// first we loop through all dom elements to see if we find at least
		// one element that's not processed yet
		var i;
		var len = all.length;
		var any = !document.body.contextTriggerProcessed; // also check body

		for (i = 0; !any && i < len; i++) {
			if (!all[i].contextTriggerProcessed) {
				any = true;
				break;
			}
		}
		if (!any) return;

		// only if we find at least one element we're going into the more
		// costly evaluation to find the top elements inserted and process those
		let found = [];
		checkNode(document.body, found);

		contextTrigger.validate(found);
	}

	if (typeof window !== 'undefined' && window.MutationObserver) {
		(function() {
			const target = window.document.body;
			const observer = new MutationObserver(mutations => {
				let i;
				let len = mutations.length;

				for (i = 0; i < len; i++) {
					if (mutations[i].addedNodes.length) {
						contextTrigger.invalidate();

						break;
					}
				}
			});
			const config = { subtree: true, childList: true };
			observer.observe(target, config);
		})();
	} else {
		setInterval(() => {
			contextTrigger.invalidate();
		}, 1000);
	}

	return contextTrigger;
})();

if (window.NodeList && !NodeList.prototype.forEach) {
    NodeList.prototype.forEach = function (callback, thisArg) {
        thisArg = thisArg || window;
        for (var i = 0; i < this.length; i++) {
            callback.call(thisArg, this[i], i, this);
        }
    };
}

// CustomEvent if IE <= 11
if (typeof window.CustomEvent !== 'function') {
	const CustomEvent = function(event, params) {
		const eventParams = params || { bubbles: false, cancelable: false, detail: null };
		const evt = document.createEvent('CustomEvent');

		evt.initCustomEvent(event, eventParams.bubbles, eventParams.cancelable, eventParams.detail);

		return evt;
	};

	CustomEvent.prototype = window.Event.prototype;
	window.CustomEvent = CustomEvent;
}

var polyfills = true;

/** *
 * The starting point of this code - and the idea - is from Nikita Vasilyev @ELV1S
 * http://n12v.com/focus-transition/
 * We've enhanced it so the focus only shows up on keyboard action thus
 * giving a cleaner look for those who work with a mouse or finger.
 ** */
const FlyingFocus = (function() {
	const KEYBOARD_ONLY = false;

	let ACTIVE = true;
	let staticCounter;

	if (document.getElementById('FlyingFocus')) return;
	if (!document.documentElement.addEventListener) return; // we don't support outdated browsers

	const flyingFocus = document.createElement('div');
	flyingFocus.id = 'FlyingFocus';

	document.body.appendChild(flyingFocus);

	// rules for fields that should always show a focus rect (like may be text fields).
	// return false if you only want to show with keyboard events
	function alwaysFocus(target) {
		// let $target = $(target);
		// if ($target.is('input')) {
		// 	let type = $target.attr('type');
		// 	return !(type == 'checkbox' || type == 'radio');
		// }
		// if ($target.is('textarea')) {
		// 	return target.style.position !== 'absolute'; // CodeMirror hidden textarea workaround
		// }
		return false;
	}

	const DURATION = 150;

	function getBounds(elem) {
		const rect = elem.getBoundingClientRect();
		const docElem = document.documentElement;
		const win = document.defaultView;
		const body = document.body;

		let clientTop = docElem.clientTop || body.clientTop || 0,
			clientLeft = docElem.clientLeft || body.clientLeft || 0,
			scrollTop = win.pageYOffset || docElem.scrollTop || body.scrollTop,
			scrollLeft = win.pageXOffset || docElem.scrollLeft || body.scrollLeft,
			top = rect.top + scrollTop - clientTop,
			left = rect.left + scrollLeft - clientLeft;

		return {
			top: top,
			left: left,
			width: rect.width,
			height: rect.height,
			bottom: top + rect.height,
			right: left + rect.width
		};
	}

	function getInputBounds(element) {
		let elements = [element];

		const id = element.getAttribute('id');
		const labels = Array.prototype.slice.call(document.querySelectorAll(`label[for="${id}"]:not(.visuallyhidden)`));

		// merge arrays
		elements = elements.concat(labels);

		const bounds = {
			top: 1000000,
			left: 1000000,
			bottom: -10000,
			right: -10000
		};

		for (var i = 0, len = elements.length; i < len; i++) {
			const elemBounds = getBounds(elements[i]);

			bounds.top = Math.min(bounds.top, elemBounds.top);
			bounds.left = Math.min(bounds.left, elemBounds.left);
			bounds.bottom = Math.max(bounds.bottom, elemBounds.bottom);
			bounds.right = Math.max(bounds.right, elemBounds.right);
		}

		bounds.width = bounds.right - bounds.left;
		bounds.height = bounds.bottom - bounds.top;

		return bounds;
	}

	function addEvent(elem, event, handler) {
		elem.addEventListener(event, handler, true);
	}

	const movingId = 0;
	let hidden = true;
	let keydownTime = 0;
	let prevFocused,
		prevOffset = {};
	let focusTimeout;

	addEvent(
		document.documentElement,
		'keydown',
		event => {
			if (event.keyCode < 65) {
				keydownTime = new Date();
			}
		},
		true
	);

	addEvent(document, 'focusin', event => {
		// console.log("Has Focus", event.target); // *remove*
		focusTimeout = setTimeout(() => {
			const override = alwaysFocus(event.target);
			if (!override && !ACTIVE) {
				return;
			}
			const target = event.target;
			if (target.id === 'FlyingFocus') {
				return;
			}

			const focusTime = new Date();
			if (!override && hidden && focusTime - keydownTime > 100) {
				// the focus was not done with a key
				// console.log("Won't focus because key down too long ago", focusTime - keydownTime); // *remove*
				return;
			}

			// console.log("Show Focus", event.target); // *remove*
			show();

			prevOffset = reposition(target);

			prevFocused = target;
		}, 1);
	});

	addEvent(document, 'focusout', e => hide());

	if (KEYBOARD_ONLY) {
		addEvent(document.documentElement, 'mousedown touchstart', event => {
			// event.detail returns the number of clicks for a mouse event
			// when we click with a key action (enter) it should be zero
			hide();
			ACTIVE = false; // if user can click, don't give him flying focus (it's what the client wants....)
		});
	} else {
		addEvent(document.documentElement, 'mousedown', event => {
			const override = alwaysFocus(event.target);
			if (event.detail && !override) {
				hideReally();
			}
		});
		addEvent(document.documentElement, 'touchstart', event => {
			const override = alwaysFocus(event.target);
			if (event.detail && !override) {
				hideReally();
			}
		});
	}

	addEvent(window, 'resize', () => reposition(prevFocused));

	let hideTimeout,
		positionTimeout,
		w = 0;

	function hide() {
		if (!hidden) {
			// console.log('Hide focus'); // *remove*
			clearTimeout(focusTimeout);
			clearTimeout(hideTimeout);
			hideTimeout = setTimeout(hideReally, 10);
		}
	}
	function hideReally() {
		flyingFocus.classList.remove('FlyingFocus-visible');

		hidden = true;

		clearTimeout(positionTimeout);
	}

	function show() {
		clearTimeout(hideTimeout);
		clearTimeout(positionTimeout);
		const duration = hidden ? 0 : DURATION / 1000;
		flyingFocus.style.transitionDuration = flyingFocus.style.WebkitTransitionDuration = duration + 's';

		staticCounter = 0;
		positionTimeout = setTimeout(checkPosition, 100);

		if (hidden) {
			flyingFocus.classList.add('FlyingFocus-visible');

			hidden = false;
		}
	}

	// sometimes when we focus an element, this will trigger some kind of
	// layout change or event animation. we'll check a few times to make sure
	// size and position will stay the same (after that we stop)
	function checkPosition() {
		const offset = reposition(prevFocused);
		if (
			offset.top != prevOffset.top ||
			offset.left != prevOffset.left ||
			offset.width != prevOffset.width ||
			offset.height != prevOffset.height
		) {
			// console.log("Changed focus position", offset, prevFocused); // *remove*
			prevOffset = offset;
			staticCounter = 0;
		} else {
			staticCounter++;
		}
		if (staticCounter < 3) {
			// at the beginning and as long as we see position changes
			// we will check the position/bounds more often
			positionTimeout = setTimeout(checkPosition, 100);
		} else {
			// we want to measure at least every 2 seconds
			positionTimeout = setTimeout(checkPosition, 1000);
		}
	}

	function reposition(target) {
		if (hidden) {
			return;
		}

		const offset = getInputBounds(target);

		if (
			offset.top !== prevOffset.top ||
			offset.left !== prevOffset.left ||
			offset.width !== prevOffset.width ||
			offset.height !== prevOffset.height
		) {
			flyingFocus.style.left = offset.left + 'px';
			flyingFocus.style.top = offset.top + 'px';
			flyingFocus.style.width = offset.width + 'px';
			flyingFocus.style.height = offset.height + 'px';
		}

		return offset;
	}

	return {};
})();

var plugins = true;

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
var contextTrigger = (() => {
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

// every module should at least implement two methods
// Module.init = function( HTMLElement )
// Module.destroy = function()
//
// Modules are per se site specific (if necessary).

const moduleInstances = [];

let garbageCollectedOnInitialise = false;

function initialiseModule(Module, element) {
	// we want old modules garbaged before creating new ones
	if (!garbageCollectedOnInitialise) {
		checkModuleGarbage();
		garbageCollectedOnInitialise = true;
		setTimeout(() => {
			garbageCollectedOnInitialise = false;
		}, 0);
	}

	let module, moduleInstance;
	measureStart();

	try {
		module = new Module();
		moduleInstance = connectModule(module, element);
	} catch (error) {
		console.error('🚨 Cannot initialise module', element);
		console.error(error);
	}

	let moduleName = 'unknown module';
	if (moduleInstance) {
		moduleName = moduleInstance.ns;
	} else if (module) {
		moduleName = module.ns;
	}
	measureStop(moduleName, element);
	return moduleInstance;
}

function connectModule(module, element) {
	const moduleInstance = module.init(element);
	let el;
	if (moduleInstance) {
		el = moduleInstance.el || element;
		el._module = moduleInstance;
		moduleInstance.___el = el;
		moduleInstances.push(moduleInstance);

		let event;
		if (typeof Event === 'function') {
			event = new Event('controllerinit', { bubbles: true });
		} else {
			event = document.createEvent('Event');
			event.initEvent('controllerinit', true, false);
		}
		el.dispatchEvent(event);
	}
	return moduleInstance;
}

function checkModuleGarbage() {
	let elem,
		inst,
		len = moduleInstances.length;
	for (let i = len - 1; i >= 0; i--) {
		inst = moduleInstances[i];
		elem = inst.___el;

		if (!document.documentElement.contains(elem)) {
			try {
				inst.___el = null;
				inst.destroy();
			} catch (e) {}
			moduleInstances.splice(i, 1);
		}
	}
}

// an interval to check wether element have been removed from dom
// if so, we'll find the module instance and call its destroy method
if (typeof window !== 'undefined' && window.MutationObserver) {
	(function() {
		const target = window.document.body;
		const observer = new MutationObserver(mutations => {
			let i;
			const len = mutations.length;
			for (i = 0; i < len; i++) {
				if (mutations[i].removedNodes.length) {
					invalidate();
					break;
				}
			}
		});
		const config = {
			subtree: true,
			childList: true
		};
		observer.observe(target, config);

		let timeout;
		function invalidate() {
			clearTimeout(timeout);
			timeout = setTimeout(validate, 50);
		}
		function validate() {
			clearTimeout(timeout);
			checkModuleGarbage();
		}
	})();
} else {
	setInterval(checkModuleGarbage, 2500);
}

let measureTime,
	totalTime = 0,
	measureTable = [];
function now() {
	return window.performance && performance.now ? performance.now() : new Date();
}
function measureStart() {
	measureTime = now();
}
function measureStop(name, element) {
	totalTime += now() - measureTime;
	measureTable.push({
		Module: name,
		Element: element,
		'Time (ms)': Math.round((now() - measureTime) * 10) / 10
	});
}

setTimeout(() => {
	console.log(`Module init took ${totalTime.toFixed(1)} ms`);

	if (console.table && measureTable.length > 0) {
		console.table(measureTable);
	}
	measureTable = [];
}, 5000);

var ModuleManager = {
	connect(Module, element) {
		initialiseModule(Module, element);
	},
	add(M, selector) {
		if (typeof Module === 'string') {
			throw new Error('Module can not be a string');
		} else {
			contextTrigger.add(selector, function() {
				const elem = this;
				initialiseModule(M, elem);
			});
		}
	},
	checkGarbage: checkModuleGarbage
};

var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

function unwrapExports (x) {
	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
}

function createCommonjsModule(fn, module) {
	return module = { exports: {} }, fn(module, module.exports), module.exports;
}

function getCjsExportFromNamespace (n) {
	return n && n['default'] || n;
}

function commonjsRequire () {
	throw new Error('Dynamic requires are not currently supported by @rollup/plugin-commonjs');
}

var fastdom = createCommonjsModule(function (module) {
!(function(win) {

/**
 * FastDom
 *
 * Eliminates layout thrashing
 * by batching DOM read/write
 * interactions.
 *
 * @author Wilson Page <wilsonpage@me.com>
 * @author Kornel Lesinski <kornel.lesinski@ft.com>
 */

'use strict';

/**
 * Mini logger
 *
 * @return {Function}
 */
var debug = 0 ? console.log.bind(console, '[fastdom]') : function() {};

/**
 * Normalized rAF
 *
 * @type {Function}
 */
var raf = win.requestAnimationFrame
  || win.webkitRequestAnimationFrame
  || win.mozRequestAnimationFrame
  || win.msRequestAnimationFrame
  || function(cb) { return setTimeout(cb, 16); };

/**
 * Initialize a `FastDom`.
 *
 * @constructor
 */
function FastDom() {
  var self = this;
  self.reads = [];
  self.writes = [];
  self.raf = raf.bind(win); // test hook
  debug('initialized', self);
}

FastDom.prototype = {
  constructor: FastDom,

  /**
   * Adds a job to the read batch and
   * schedules a new frame if need be.
   *
   * @param  {Function} fn
   * @param  {Object} ctx the context to be bound to `fn` (optional).
   * @public
   */
  measure: function(fn, ctx) {
    debug('measure');
    var task = !ctx ? fn : fn.bind(ctx);
    this.reads.push(task);
    scheduleFlush(this);
    return task;
  },

  /**
   * Adds a job to the
   * write batch and schedules
   * a new frame if need be.
   *
   * @param  {Function} fn
   * @param  {Object} ctx the context to be bound to `fn` (optional).
   * @public
   */
  mutate: function(fn, ctx) {
    debug('mutate');
    var task = !ctx ? fn : fn.bind(ctx);
    this.writes.push(task);
    scheduleFlush(this);
    return task;
  },

  /**
   * Clears a scheduled 'read' or 'write' task.
   *
   * @param {Object} task
   * @return {Boolean} success
   * @public
   */
  clear: function(task) {
    debug('clear', task);
    return remove(this.reads, task) || remove(this.writes, task);
  },

  /**
   * Extend this FastDom with some
   * custom functionality.
   *
   * Because fastdom must *always* be a
   * singleton, we're actually extending
   * the fastdom instance. This means tasks
   * scheduled by an extension still enter
   * fastdom's global task queue.
   *
   * The 'super' instance can be accessed
   * from `this.fastdom`.
   *
   * @example
   *
   * var myFastdom = fastdom.extend({
   *   initialize: function() {
   *     // runs on creation
   *   },
   *
   *   // override a method
   *   measure: function(fn) {
   *     // do extra stuff ...
   *
   *     // then call the original
   *     return this.fastdom.measure(fn);
   *   },
   *
   *   ...
   * });
   *
   * @param  {Object} props  properties to mixin
   * @return {FastDom}
   */
  extend: function(props) {
    debug('extend', props);
    if (typeof props != 'object') throw new Error('expected object');

    var child = Object.create(this);
    mixin(child, props);
    child.fastdom = this;

    // run optional creation hook
    if (child.initialize) child.initialize();

    return child;
  },

  // override this with a function
  // to prevent Errors in console
  // when tasks throw
  catch: null
};

/**
 * Schedules a new read/write
 * batch if one isn't pending.
 *
 * @private
 */
function scheduleFlush(fastdom) {
  if (!fastdom.scheduled) {
    fastdom.scheduled = true;
    fastdom.raf(flush.bind(null, fastdom));
    debug('flush scheduled');
  }
}

/**
 * Runs queued `read` and `write` tasks.
 *
 * Errors are caught and thrown by default.
 * If a `.catch` function has been defined
 * it is called instead.
 *
 * @private
 */
function flush(fastdom) {
  debug('flush');

  var writes = fastdom.writes;
  var reads = fastdom.reads;
  var error;

  try {
    debug('flushing reads', reads.length);
    runTasks(reads);
    debug('flushing writes', writes.length);
    runTasks(writes);
  } catch (e) { error = e; }

  fastdom.scheduled = false;

  // If the batch errored we may still have tasks queued
  if (reads.length || writes.length) scheduleFlush(fastdom);

  if (error) {
    debug('task errored', error.message);
    if (fastdom.catch) fastdom.catch(error);
    else throw error;
  }
}

/**
 * We run this inside a try catch
 * so that if any jobs error, we
 * are able to recover and continue
 * to flush the batch until it's empty.
 *
 * @private
 */
function runTasks(tasks) {
  debug('run tasks');
  var task; while (task = tasks.shift()) task();
}

/**
 * Remove an item from an Array.
 *
 * @param  {Array} array
 * @param  {*} item
 * @return {Boolean}
 */
function remove(array, item) {
  var index = array.indexOf(item);
  return !!~index && !!array.splice(index, 1);
}

/**
 * Mixin own properties of source
 * object into the target.
 *
 * @param  {Object} target
 * @param  {Object} source
 */
function mixin(target, source) {
  for (var key in source) {
    if (source.hasOwnProperty(key)) target[key] = source[key];
  }
}

// There should never be more than
// one instance of `FastDom` in an app
var exports = win.fastdom = (win.fastdom || new FastDom()); // jshint ignore:line

// Expose to CJS & AMD
if ((typeof undefined) == 'function') undefined(function() { return exports; });
else if (('object') == 'object') module.exports = exports;

})( typeof window !== 'undefined' ? window : commonjsGlobal);
});

// jshint ignore:start

function captureAttributeChange(el, attr, callback) {
	let cancelFunc, startFunc;
	if (window.MutationObserver) {
		const observer = new MutationObserver(mutations => {
			mutations.forEach(mutation => {
				if (!attr || mutation.attributeName === attr) {
					callback.call(el, mutation.attributeName);
				}
			});
		});
		startFunc = function() {
			observer.observe(el, {
				attributes: true,
				subtree: false,
			});
		};
		cancelFunc = function() {
			observer.disconnect();
		};
	} else {
		const checkAttr = function(event) {
			if (event.target !== el) {
				return
			}
			if (attr && event.attrName !== attr) {
				return
			}
			callback.call(el, event.attrName);
		};
		startFunc = function() {
			el.addEventListener('DOMAttrModified', checkAttr, false);
		};
		cancelFunc = function() {
			el.removeEventListener('DOMAttrModified', checkAttr, false);
		};
	}

	startFunc();
	return {
		cancel: cancelFunc,
		start() {
			cancelFunc();
			startFunc();
		},
	}
}

function dispatchChange(el) {
	dispatchEvent(el, 'input'); // for Vue.js
	dispatchEvent(el, 'change');
}

function dispatchEvent(el, eventType, bubbles, cancelable) {
	if (typeof bubbles === 'undefined') {
		bubbles = true;
	}
	if (typeof cancelable === 'undefined') {
		cancelable = true;
	}
	const event = document.createEvent('HTMLEvents');
	event.initEvent(eventType, bubbles, cancelable);
	el.dispatchEvent(event);
}

/**
 * Source: _.now from Underscore.js 1.8.3 http://underscorejs.org/
 *
 * A (possibly faster) way to get the current timestamp as an integer.
 */
const rightNow =
	Date.now ||
	function() {
		return new Date().getTime()
	};

/**
 * Source: _.throttle from Underscore.js 1.8.3 http://underscorejs.org/
 *
 * Returns a function, that, when invoked, will only be triggered at most once
 * during a given window of time. Normally, the throttled function will run
 * as much as it can, without ever going more than once per `wait` duration;
 * but if you'd like to disable the execution on the leading edge, pass
 * `{leading: false}`. To disable execution on the trailing edge, ditto.
 */
function throttleCallback(func, wait, options) {
	let timeout, context, args, result;
	let previous = 0;
	if (!options) {
		options = {};
	}

	const later = function() {
		previous = options.leading === false ? 0 : rightNow();
		timeout = null;
		result = func.apply(context, args);
		if (!timeout) {
			context = args = null;
		}
	};

	const throttled = function() {
		const now = rightNow();
		if (!previous && options.leading === false) {
			previous = now;
		}
		const remaining = wait - (now - previous);
		context = this;
		args = arguments;
		if (remaining <= 0 || remaining > wait) {
			if (timeout) {
				clearTimeout(timeout);
				timeout = null;
			}
			previous = now;
			result = func.apply(context, args);
			if (!timeout) {
				context = args = null;
			}
		} else if (!timeout && options.trailing !== false) {
			timeout = setTimeout(later, remaining);
		}
		return result
	};

	throttled.cancel = function() {
		clearTimeout(timeout);
		previous = 0;
		timeout = context = args = null;
	};

	return throttled
}

function onSelector(el, selector, eventType, callback, options) {
	el.addEventListener(
		eventType,
		event => {
			let targetEl = event.target;
			while (targetEl && targetEl !== el) {
				if ((targetEl.matches || targetEl.msMatchesSelector).call(targetEl, selector)) {
					callback(event, targetEl);
				}
				targetEl = targetEl.parentElement;
			}
		},
		options
	);
}

var EventHelper = {
	captureAttributeChange,
	dispatchEvent,
	dispatchChange,
	throttleCallback,
	onSelector,
};

const elements = [];
let newElements = [];
let validateNewElementsRequest, validateRequest, validateTimeout;
let stylesLoaded = false;

function checkStyles() {
	const content = window
		.getComputedStyle(document.body, ':after')
		.getPropertyValue('content')
		.replace(/['"]+/g, '');
	if (content !== 'loading') {
		// please refer to _styles-abovefold.scss
		stylesLoaded = true;
		validateAll();
	} else {
		console.log('🎨 Final styles not yet loaded ...');
		setTimeout(checkStyles, 100);
	}
}

window.visibilityCheckerTime = 0;
window.visibilityCheckerCount = 0;

document.addEventListener('scroll', validateAll, { passive: true, capture: true });
window.addEventListener('resize', validateAll);
document.addEventListener('visibilitychange', validateSoon);
checkStyles();

function handleMutations(mutations) {
	for (let i = mutations.length - 1; i >= 0; i--) {
		const m = mutations[i];
		if (m.type !== 'attributes' || m.attributeName !== 'style') {
			validateSoon();
			return
		}
	}
	validateLater(); // only style attribute changed, we're gonna take it easy
}

if (window.MutationObserver) {
	new MutationObserver(handleMutations).observe(document.body, {
		subtree: true,
		childList: true,
		attributes: true,
	});
	document.body.addEventListener('transitionend', validateLater);
} else {
	setInterval(validateAll, 1000);
}

function add(el, options) {
	el.visibilityCheckerOptions = Object.assign(
		{},
		{
			notify: 'once',
			callback: null,
			onshow: null,
			onhide: null,
			visible: false,
			ignoreViewport: false,
			ignoreVisibility: false,
			requireSize: false,
			extent: 1.5,
		},
		options
	);
	newElements.push(el);
	if (!validateNewElementsRequest) {
		validateNewElementsRequest = AnimationFrame.request(validateNew);
	}
}

function remove(el) {
	let index;
	index = elements.indexOf(el);
	if (index >= 0) {
		elements.splice(index, 1);
	}
	index = newElements.indexOf(el);
	if (index >= 0) {
		newElements.splice(index, 1);
	}
}

function validateNew() {
	const currentNew = newElements;
	newElements = [];
	validateNewElementsRequest = null;
	elements.push.apply(elements, currentNew);
	validate(currentNew);
}

function validateAll() {
	clearTimeout(validateTimeout);
	validateTimeout = null;
	AnimationFrame.cancel(validateRequest);
	validateRequest = null;
	validate(elements);
}

function validateSoon() {
	if (!validateRequest) {
		validateRequest = AnimationFrame.request(() => {
			validateAll();
		});
	}
}
function validateLater() {
	if (!validateTimeout) {
		validateTimeout = setTimeout(() => {
			validateAll();
		}, 500);
	}
}

function validate(check) {
	if (!stylesLoaded) return

	fastdom.measure(() => {
		const t = performance.now();
		const elementsBecameVisible = [];
		const elementsBecameInvisible = [];
		const elementsWillBeRemoved = [];

		for (let i = 0, len = check.length; i < len; i++) {
			const el = check[i];
			const options = el.visibilityCheckerOptions || {};
			const visible = isVisible(el, options);
			if (!options.visible && visible) {
				elementsBecameVisible.push(el);
				if (options.notify === 'once') {
					elementsWillBeRemoved.push(el);
				}
			} else if (options.visible && !visible) {
				elementsBecameInvisible.push(el);
				if (options.notify === 'once') {
					elementsWillBeRemoved.push(el);
				}
			}

			options.visible = visible;
		}

		window.visibilityCheckerTime += performance.now() - t;
		window.visibilityCheckerCount++;

		if (elementsBecameVisible.length) {
			notifyVisibility(elementsBecameVisible, true);
		}
		if (elementsBecameInvisible.length) {
			notifyVisibility(elementsBecameInvisible, false);
		}
		if (elementsWillBeRemoved.length) {
			for (let i = elementsWillBeRemoved.length - 1; i >= 0; i--) {
				elements.splice(elements.indexOf(elementsWillBeRemoved[i]), 1);
			}
		}
	});
}

function isVisible(el, options) {
	// this would work with fixed elements too:
	// !!( el.offsetWidth || el.offsetHeight || el.getClientRects().length )
	// see https://jsperf.com/visible-html-el for possible solutions
	if (!options) {
		options = {};
	}

	if (!el.offsetParent && !el.clientHeight && !el.clientWidth) {
		// when display is none
		return false
	}

	if (options.requireSize && !(el.clientHeight && el.clientWidth)) {
		return false
	}

	if (!options.ignoreViewport && !isInViewport(el, options)) {
		return false
	}

	if (!options.ignoreVisibility && window.getComputedStyle(el).visibility === 'hidden') {
		return false
	}

	return true
}

function notifyVisibility(elArray, visible) {
	elArray.forEach(el => {
		const options = el.visibilityCheckerOptions || {};
		if (options.callback) {
			options.callback(el, visible);
		} else if (options.onshow && visible) {
			options.onshow(el);
		} else if (options.onhide && !visible) {
			options.onhide(el);
		} else {
			dispatchEvent(el, visible ? 'visible' : 'invisible', false);
		}
	});
}

// extent should be between 0 and 2
function isInViewport(element, options) {
	if (typeof options !== 'object') {
		options = {}; // extent (>0), direction (both|vertical|horizontal), cover (entire|partial)
	}
	if (typeof options.extent === 'undefined') {
		options.extent = 1.1;
	}
	const t = element,
		vpWidth = window.innerWidth,
		vpHeight = window.innerHeight,
		checkWidth = options.extent * vpWidth,
		checkHeight = options.extent * vpHeight,
		minX = (vpWidth - checkWidth) / 2,
		maxX = (vpWidth + checkWidth) / 2,
		minY = (vpHeight - checkHeight) / 2,
		maxY = (vpHeight + checkHeight) / 2,
		partial = options.cover !== 'entire';

	const rec = t.getBoundingClientRect(),
		tViz = Math.max(rec.top, minY),
		bViz = Math.min(rec.bottom, maxY),
		lViz = Math.max(rec.left, minX),
		rViz = Math.min(rec.right, maxX),
		vViz = rec.height
			? (bViz - tViz) / Math.min(rec.height, maxY - minY)
			: tViz === rec.top && bViz === rec.bottom,
		hViz = rec.width
			? (rViz - lViz) / Math.min(rec.width, maxX - minX)
			: lViz === rec.left && rViz === rec.right,
		vVisible = partial ? vViz > 0 : vViz === 1,
		hVisible = partial ? hViz > 0 : hViz === 1;

	if (options.direction === 'vertical') {
		return vVisible
	}
	if (options.direction === 'horizontal') {
		return hVisible
	}
	return vVisible && hVisible
}

// extent should be between 0 and 2
function viewportProgress(element) {
	if (!element.offsetParent && !element.clientWidth && !element.clientHeight) {
		return -1
	}
	const size = element.getBoundingClientRect();
	return 1 - (size.top + size.height) / (window.innerHeight + size.height)
}

var VisibilityChecker = {
	add,
	remove,
	visible: isVisible,
	progress: viewportProgress,
	invalidate: validateSoon,
};

/* eslint-disable */


let time = new Date();


function registerElement(selector, cb, options = {}) {
	contextTrigger.add(selector, el => {
		if (options.defer === 'visible') {
			VisibilityChecker.add(el, {
				notify: 'once',
				extent: 1.1,
				onshow: () => cb(el)
			});
		} else {
			cb(el);
		}
	});
}


registerElement('.js-Alert', function initAlert(elem) {
	import('./Alert-d2a23f17.js').then(({ default: Alert }) => {
		ModuleManager.init(Alert, elem);
	});
}, { defer: '' });



contextTrigger.validate(document.body);

console.log("Selecting components took: ", new Date() - time, 'ms');

var modules = true;

var ui = true;

export default ui;

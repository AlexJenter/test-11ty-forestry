var UI = (function () {
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
    	var CustomEvent$1 = function(event, params) {
    		var eventParams = params || { bubbles: false, cancelable: false, detail: null };
    		var evt = document.createEvent('CustomEvent');

    		evt.initCustomEvent(event, eventParams.bubbles, eventParams.cancelable, eventParams.detail);

    		return evt;
    	};

    	CustomEvent$1.prototype = window.Event.prototype;
    	window.CustomEvent = CustomEvent$1;
    }

    var polyfills = true;

    /** *
     * The starting point of this code - and the idea - is from Nikita Vasilyev @ELV1S
     * http://n12v.com/focus-transition/
     * We've enhanced it so the focus only shows up on keyboard action thus
     * giving a cleaner look for those who work with a mouse or finger.
     ** */
    var FlyingFocus = (function() {
    	var KEYBOARD_ONLY = false;

    	var ACTIVE = true;
    	var staticCounter;

    	if (document.getElementById('FlyingFocus')) { return; }
    	if (!document.documentElement.addEventListener) { return; } // we don't support outdated browsers

    	var flyingFocus = document.createElement('div');
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

    	var DURATION = 150;

    	function getBounds(elem) {
    		var rect = elem.getBoundingClientRect();
    		var docElem = document.documentElement;
    		var win = document.defaultView;
    		var body = document.body;

    		var clientTop = docElem.clientTop || body.clientTop || 0,
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
    		var elements = [element];

    		var id = element.getAttribute('id');
    		var labels = Array.prototype.slice.call(document.querySelectorAll(("label[for=\"" + id + "\"]:not(.visuallyhidden)")));

    		// merge arrays
    		elements = elements.concat(labels);

    		var bounds = {
    			top: 1000000,
    			left: 1000000,
    			bottom: -10000,
    			right: -10000
    		};

    		for (var i = 0, len = elements.length; i < len; i++) {
    			var elemBounds = getBounds(elements[i]);

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

    	var movingId = 0;
    	var hidden = true;
    	var keydownTime = 0;
    	var prevFocused,
    		prevOffset = {};
    	var focusTimeout;

    	addEvent(
    		document.documentElement,
    		'keydown',
    		function (event) {
    			if (event.keyCode < 65) {
    				keydownTime = new Date();
    			}
    		},
    		true
    	);

    	addEvent(document, 'focusin', function (event) {
    		// console.log("Has Focus", event.target); // *remove*
    		focusTimeout = setTimeout(function () {
    			var override = alwaysFocus(event.target);
    			if (!override && !ACTIVE) {
    				return;
    			}
    			var target = event.target;
    			if (target.id === 'FlyingFocus') {
    				return;
    			}

    			var focusTime = new Date();
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

    	addEvent(document, 'focusout', function (e) { return hide(); });

    	if (KEYBOARD_ONLY) {
    		addEvent(document.documentElement, 'mousedown touchstart', function (event) {
    			// event.detail returns the number of clicks for a mouse event
    			// when we click with a key action (enter) it should be zero
    			hide();
    			ACTIVE = false; // if user can click, don't give him flying focus (it's what the client wants....)
    		});
    	} else {
    		addEvent(document.documentElement, 'mousedown', function (event) {
    			var override = alwaysFocus(event.target);
    			if (event.detail && !override) {
    				hideReally();
    			}
    		});
    		addEvent(document.documentElement, 'touchstart', function (event) {
    			var override = alwaysFocus(event.target);
    			if (event.detail && !override) {
    				hideReally();
    			}
    		});
    	}

    	addEvent(window, 'resize', function () { return reposition(prevFocused); });

    	var hideTimeout,
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
    		var duration = hidden ? 0 : DURATION / 1000;
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
    		var offset = reposition(prevFocused);
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

    		var offset = getInputBounds(target);

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
    var contextTrigger = (function () {
    	var contextTrigger = {
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
    		for (var i = contextTrigger.events.length - 1; i >= 0; i--) {
    			var evt = contextTrigger.events[i];

    			if (evt.selector === selector && evt.callback === callback) {
    				contextTrigger.events.splice(i, 1);
    				return true;
    			}
    		}
    		return false;
    	};

    	contextTrigger.invalidate = function() {
    		var this$1 = this;

    		if (contextTrigger.events.length) {
    			if (!this.validationTimeout) {
    				this.validationTimeout = setTimeout(function () {
    					this$1.validationTimeout = null;
    					checkForNewElements();
    				}, 50);
    			}
    		}
    	};

    	contextTrigger.validate = function(rootEl) {
    		var evt;
    		var contextEls;
    		rootEl = rootEl || document.body;

    		var rootEls = rootEl instanceof Array ? rootEl : [rootEl];

    		if (!rootEls.length) {
    			return false;
    		}

    		var i, j, k, contextEl, foundInContext, foundElements;

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
    			var c = node.firstChild;

    			while (c) {
    				if (c.nodeType === 1) {
    					checkNode(c, result);
    				}

    				c = c.nextSibling;
    			}
    		}
    	}

    	var all = document.body.getElementsByTagName('*');

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
    		if (!any) { return; }

    		// only if we find at least one element we're going into the more
    		// costly evaluation to find the top elements inserted and process those
    		var found = [];
    		checkNode(document.body, found);

    		contextTrigger.validate(found);
    	}

    	if (typeof window !== 'undefined' && window.MutationObserver) {
    		(function() {
    			var target = window.document.body;
    			var observer = new MutationObserver(function (mutations) {
    				var i;
    				var len = mutations.length;

    				for (i = 0; i < len; i++) {
    					if (mutations[i].addedNodes.length) {
    						contextTrigger.invalidate();

    						break;
    					}
    				}
    			});
    			var config = { subtree: true, childList: true };
    			observer.observe(target, config);
    		})();
    	} else {
    		setInterval(function () {
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

    var moduleInstances = [];

    var garbageCollectedOnInitialise = false;

    function initialiseModule(Module, element) {
    	// we want old modules garbaged before creating new ones
    	if (!garbageCollectedOnInitialise) {
    		checkModuleGarbage();
    		garbageCollectedOnInitialise = true;
    		setTimeout(function () {
    			garbageCollectedOnInitialise = false;
    		}, 0);
    	}

    	var module, moduleInstance;
    	measureStart();

    	try {
    		module = new Module();
    		moduleInstance = connectModule(module, element);
    	} catch (error) {
    		console.error('🚨 Cannot initialise module', element);
    		console.error(error);
    	}

    	var moduleName = 'unknown module';
    	if (moduleInstance) {
    		moduleName = moduleInstance.ns;
    	} else if (module) {
    		moduleName = module.ns;
    	}
    	measureStop(moduleName, element);
    	return moduleInstance;
    }

    function connectModule(module, element) {
    	var moduleInstance = module.init(element);
    	var el;
    	if (moduleInstance) {
    		el = moduleInstance.el || element;
    		el._module = moduleInstance;
    		moduleInstance.___el = el;
    		moduleInstances.push(moduleInstance);

    		var event;
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
    	var elem,
    		inst,
    		len = moduleInstances.length;
    	for (var i = len - 1; i >= 0; i--) {
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
    		var target = window.document.body;
    		var observer = new MutationObserver(function (mutations) {
    			var i;
    			var len = mutations.length;
    			for (i = 0; i < len; i++) {
    				if (mutations[i].removedNodes.length) {
    					invalidate();
    					break;
    				}
    			}
    		});
    		var config = {
    			subtree: true,
    			childList: true
    		};
    		observer.observe(target, config);

    		var timeout;
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

    var measureTime,
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

    setTimeout(function () {
    	console.log(("Module init took " + (totalTime.toFixed(1)) + " ms"));

    	if (console.table && measureTable.length > 0) {
    		console.table(measureTable);
    	}
    	measureTable = [];
    }, 5000);

    var ModuleManager = {
    	connect: function connect(Module, element) {
    		initialiseModule(Module, element);
    	},
    	add: function add(M, selector) {
    		if (typeof Module === 'string') {
    			throw new Error('Module can not be a string');
    		} else {
    			contextTrigger.add(selector, function() {
    				var elem = this;
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
    	var cancelFunc, startFunc;
    	if (window.MutationObserver) {
    		var observer = new MutationObserver(function (mutations) {
    			mutations.forEach(function (mutation) {
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
    		var checkAttr = function(event) {
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
    		start: function start() {
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
    	var event = document.createEvent('HTMLEvents');
    	event.initEvent(eventType, bubbles, cancelable);
    	el.dispatchEvent(event);
    }

    /**
     * Source: _.now from Underscore.js 1.8.3 http://underscorejs.org/
     *
     * A (possibly faster) way to get the current timestamp as an integer.
     */
    var rightNow =
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
    	var timeout, context, args, result;
    	var previous = 0;
    	if (!options) {
    		options = {};
    	}

    	var later = function() {
    		previous = options.leading === false ? 0 : rightNow();
    		timeout = null;
    		result = func.apply(context, args);
    		if (!timeout) {
    			context = args = null;
    		}
    	};

    	var throttled = function() {
    		var now = rightNow();
    		if (!previous && options.leading === false) {
    			previous = now;
    		}
    		var remaining = wait - (now - previous);
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
    		function (event) {
    			var targetEl = event.target;
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
    	captureAttributeChange: captureAttributeChange,
    	dispatchEvent: dispatchEvent,
    	dispatchChange: dispatchChange,
    	throttleCallback: throttleCallback,
    	onSelector: onSelector,
    };

    var elements = [];
    var newElements = [];
    var validateNewElementsRequest, validateRequest, validateTimeout;
    var stylesLoaded = false;

    function checkStyles() {
    	var content = window
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
    	for (var i = mutations.length - 1; i >= 0; i--) {
    		var m = mutations[i];
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
    	var index;
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
    	var currentNew = newElements;
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
    		validateRequest = AnimationFrame.request(function () {
    			validateAll();
    		});
    	}
    }
    function validateLater() {
    	if (!validateTimeout) {
    		validateTimeout = setTimeout(function () {
    			validateAll();
    		}, 500);
    	}
    }

    function validate(check) {
    	if (!stylesLoaded) { return }

    	fastdom.measure(function () {
    		var t = performance.now();
    		var elementsBecameVisible = [];
    		var elementsBecameInvisible = [];
    		var elementsWillBeRemoved = [];

    		for (var i = 0, len = check.length; i < len; i++) {
    			var el = check[i];
    			var options = el.visibilityCheckerOptions || {};
    			var visible = isVisible(el, options);
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
    			for (var i$1 = elementsWillBeRemoved.length - 1; i$1 >= 0; i$1--) {
    				elements.splice(elements.indexOf(elementsWillBeRemoved[i$1]), 1);
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
    	elArray.forEach(function (el) {
    		var options = el.visibilityCheckerOptions || {};
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
    	var t = element,
    		vpWidth = window.innerWidth,
    		vpHeight = window.innerHeight,
    		checkWidth = options.extent * vpWidth,
    		checkHeight = options.extent * vpHeight,
    		minX = (vpWidth - checkWidth) / 2,
    		maxX = (vpWidth + checkWidth) / 2,
    		minY = (vpHeight - checkHeight) / 2,
    		maxY = (vpHeight + checkHeight) / 2,
    		partial = options.cover !== 'entire';

    	var rec = t.getBoundingClientRect(),
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
    	var size = element.getBoundingClientRect();
    	return 1 - (size.top + size.height) / (window.innerHeight + size.height)
    }

    var VisibilityChecker = {
    	add: add,
    	remove: remove,
    	visible: isVisible,
    	progress: viewportProgress,
    	invalidate: validateSoon,
    };

    /* eslint-disable */


    var time = new Date();


    function registerElement(selector, cb, options) {
    	if ( options === void 0 ) options = {};

    	contextTrigger.add(selector, function (el) {
    		if (options.defer === 'visible') {
    			VisibilityChecker.add(el, {
    				notify: 'once',
    				extent: 1.1,
    				onshow: function () { return cb(el); }
    			});
    		} else {
    			cb(el);
    		}
    	});
    }


    registerElement('.js-Alert', function initAlert(elem) {
    	Promise.resolve().then(function () { return Alert$1; }).then(function (ref) {
    		var Alert = ref.default;

    		ModuleManager.init(Alert, elem);
    	});
    }, { defer: '' });



    contextTrigger.validate(document.body);

    console.log("Selecting components took: ", new Date() - time, 'ms');

    var modules = true;

    var ui = true;

    var node = function(value) {
    	return value !== undefined && value instanceof HTMLElement && value.nodeType === 1;
    };

    var nodeList = function(value) {
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
    var rootNode = function(value) {
    	var type = Object.prototype.toString.call(value);

    	return type === '[object HTMLHtmlElement]' || type === '[object Window]' || type === '[object HTMLDocument]';
    };

    var svg = function(value) {
    	return value !== undefined && value instanceof SVGElement;
    };

    var object = function(value) {
    	return Object.prototype.toString.call(value) === '[object Object]';
    };

    var string = function(value) {
    	return typeof value === 'string' || value instanceof String;
    };

    var fn = function(value) {
    	return Object.prototype.toString.call(value) === '[object Function]';
    };

    var checkType = {
    	node: node,
    	nodeList: nodeList,
    	rootNode: rootNode,
    	svg: svg,
    	object: object,
    	string: string,
    	fn: fn
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

    		if (!document.documentElement.contains(el)) { return null; }

    		do {
    			if (el.matches(s)) { return el; }
    			el = el.parentElement || el.parentNode;
    		} while (el !== null && el.nodeType === 1);

    		return null;
    	};
    }

    var namespaces = {};

    function getNamespace(ns) {
    	if (!namespaces[ns]) {
    		namespaces[ns] = {};
    	}

    	return namespaces[ns];
    }

    function getListenerOfSameTypeInNamespace(ns, type) {
    	var namespace = getNamespace(ns);

    	if (!namespace[type]) {
    		namespace[type] = [];
    	}

    	return namespace[type];
    }

    function addListener(node, type, callback) {
    	var startOfNs = type.indexOf('.');

    	if (startOfNs !== -1) {
    		var ns = type.substring(startOfNs, type.length);
    		type = type.substring(0, startOfNs);

    		var listenerInNamespace = getListenerOfSameTypeInNamespace(ns, type);

    		listenerInNamespace.push({
    			node: node,
    			fn: callback
    		});
    	}

    	return node.addEventListener(type, callback);
    }

    function removeListenersByNamespace(namespace) {
    	var ns = getNamespace(namespace);

    	for (var type in ns) {
    		for (var i = 0; i < ns[type].length; i++) {
    			var pair = ns[type][i];

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
    function onSelector$1(selector, type, callback) {
    	return delegate(document.body, selector, type, callback);
    }

    function onDelegated(element, type, selector, callback) {
    	return delegate(element, selector, type, callback);
    }

    /**
     *
     */
    function on() {
    	var args = Array.prototype.slice.call(arguments); // copy arguments
    	var target = args[0];

    	if (args.length === 4) {
    		return onDelegated.apply(this, args);
    	} else {
    		if (checkType.node(target) || checkType.rootNode(target)) {
    			return onNode.apply(this, args);
    		} else if (checkType.nodeList(target)) {
    			return onNodeList.apply(this, args);
    		} else if (checkType.string(target)) {
    			return onSelector$1.apply(this, args);
    		} else {
    			throw new TypeError('First argument must be a String, HTMLElement, HTMLCollection, or NodeList');
    		}
    	}
    }

    var EventListener = {
    	on: on,
    	one: function() {
    		var arguments$1 = arguments;

    		var loop = function ( i ) {
    			var fn = arguments$1[i];

    			if (checkType.fn(fn)) {
    				var executeAndRemove = function(e) {
    					fn.call(this, e);

    					e.currentTarget.removeEventListener(e.type, executeAndRemove);
    				};

    				arguments$1[i] = executeAndRemove;
    			}
    		};

    		for (var i = 0; i < arguments.length; i++) loop( i );

    		on.apply(this, arguments);
    	},
    	off: function() {
    		var args = Array.prototype.slice.call(arguments); // copy arguments

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

    var BaseModule = (function() {
    	var namespaces = {};

    	return /*@__PURE__*/(function () {
    		function BaseModule() {
    			this.el = null;

    			this.ns = BaseModule.ns(this.constructor.name);
    		}

    		BaseModule.ns = function ns (name) {
    			if (!namespaces[name]) {
    				namespaces[name] = 0;
    			}

    			return ("." + name + (++namespaces[name]));
    		};

    		BaseModule.prototype.init = function init (element) {
    			this.el = element;

    			return this;
    		};

    		BaseModule._getListenerArguments = function _getListenerArguments () {
    			var event, selector, handler, target;

    			var args = Array.prototype.slice.call(arguments); // copy arguments

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

    			event = event.replace(/(\s+|$)/g, ((this.ns) + "$1"));

    			if (selector) {
    				return [target, event, selector, handler];
    			}

    			return [target, event, handler];
    		};

    		// on(event, selector, handler)
    		// on(element, event, selector, handler)
    		// on(event, handler)
    		// on(element, event, handler)
    		BaseModule.prototype.on = function on () {
    			var args = BaseModule._getListenerArguments.apply(this, arguments);

    			EventListener.on.apply(this.el, args);
    		};

    		BaseModule.prototype.one = function one () {
    			var args = BaseModule._getListenerArguments.apply(this, arguments);

    			EventListener.one.apply(this.el, args);
    		};

    		BaseModule.prototype.trigger = function trigger () {
    			var args = [], len = arguments.length;
    			while ( len-- ) args[ len ] = arguments[ len ];

    			args.unshift(this.el);

    			EventListener.trigger.apply(this.el, args);
    		};

    		BaseModule.prototype.off = function off () {
    			EventListener.off(this.ns);

    			if (this.nstemp) {
    				EventListener.off(this.nstemp);
    			}
    		};

    		BaseModule.prototype.destroy = function destroy () {
    			this.off();

    			if (this.el) {
    				// remove event listeners
    				this.el = undefined;
    			}
    		};

    		BaseModule.prototype.bind = function bind (method) {
    			var self = this;

    			return function() {
    				method.apply(self, arguments);
    			};
    		};

    		return BaseModule;
    	}());
    })();

    /**
     * Alert
     *
     * @selector .js-Alert
     * @enabled true
     */

    var Alert = /*@__PURE__*/(function (BaseModule) {
    	function Alert() {
    		BaseModule.call(this);
    	}

    	if ( BaseModule ) Alert.__proto__ = BaseModule;
    	Alert.prototype = Object.create( BaseModule && BaseModule.prototype );
    	Alert.prototype.constructor = Alert;

    	Alert.prototype.init = function init (element) {
    		var this$1 = this;

    		this.el = element;

    		this.one('click', function () { return console.log(this$1.ns, 'listen once'); });

    		this.on('mouseenter', function () { return console.log(this$1.ns, 'mouseenter'); });

    		this.on(window, 'resize', function () { return console.log(this$1.ns, 'onWindowResize'); });
    		this.on('click', '.js-Alert--inner', function () { return console.log(this$1.ns, '.js-Alert--inner'); });
    		this.on(document, 'click', '.js-Alert', function () { return console.log(this$1.ns, 'global delegate'); });

    		this.on('click', function () {
    			console.log(this$1.ns, 'element handler');

    			this$1.off(this$1.ns);

    			console.log('goodbye');
    		});

    		return this;
    	};

    	return Alert;
    }(BaseModule));

    var Alert$1 = /*#__PURE__*/Object.freeze({
        __proto__: null,
        'default': Alert
    });

    return ui;

}());

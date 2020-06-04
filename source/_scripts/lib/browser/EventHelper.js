// jshint ignore:start

export function captureAttributeChange(el, attr, callback) {
	let cancelFunc, startFunc
	if (window.MutationObserver) {
		const observer = new MutationObserver(mutations => {
			mutations.forEach(mutation => {
				if (!attr || mutation.attributeName === attr) {
					callback.call(el, mutation.attributeName)
				}
			})
		})
		startFunc = function() {
			observer.observe(el, {
				attributes: true,
				subtree: false,
			})
		}
		cancelFunc = function() {
			observer.disconnect()
		}
	} else {
		const checkAttr = function(event) {
			if (event.target !== el) {
				return
			}
			if (attr && event.attrName !== attr) {
				return
			}
			callback.call(el, event.attrName)
		}
		startFunc = function() {
			el.addEventListener('DOMAttrModified', checkAttr, false)
		}
		cancelFunc = function() {
			el.removeEventListener('DOMAttrModified', checkAttr, false)
		}
	}

	startFunc()
	return {
		cancel: cancelFunc,
		start() {
			cancelFunc()
			startFunc()
		},
	}
}

export function dispatchChange(el) {
	dispatchEvent(el, 'input') // for Vue.js
	dispatchEvent(el, 'change')
}

export function dispatchEvent(el, eventType, bubbles, cancelable) {
	if (typeof bubbles === 'undefined') {
		bubbles = true
	}
	if (typeof cancelable === 'undefined') {
		cancelable = true
	}
	const event = document.createEvent('HTMLEvents')
	event.initEvent(eventType, bubbles, cancelable)
	el.dispatchEvent(event)
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
	}

/**
 * Source: _.throttle from Underscore.js 1.8.3 http://underscorejs.org/
 *
 * Returns a function, that, when invoked, will only be triggered at most once
 * during a given window of time. Normally, the throttled function will run
 * as much as it can, without ever going more than once per `wait` duration;
 * but if you'd like to disable the execution on the leading edge, pass
 * `{leading: false}`. To disable execution on the trailing edge, ditto.
 */
export function throttleCallback(func, wait, options) {
	let timeout, context, args, result
	let previous = 0
	if (!options) {
		options = {}
	}

	const later = function() {
		previous = options.leading === false ? 0 : rightNow()
		timeout = null
		result = func.apply(context, args)
		if (!timeout) {
			context = args = null
		}
	}

	const throttled = function() {
		const now = rightNow()
		if (!previous && options.leading === false) {
			previous = now
		}
		const remaining = wait - (now - previous)
		context = this
		args = arguments
		if (remaining <= 0 || remaining > wait) {
			if (timeout) {
				clearTimeout(timeout)
				timeout = null
			}
			previous = now
			result = func.apply(context, args)
			if (!timeout) {
				context = args = null
			}
		} else if (!timeout && options.trailing !== false) {
			timeout = setTimeout(later, remaining)
		}
		return result
	}

	throttled.cancel = function() {
		clearTimeout(timeout)
		previous = 0
		timeout = context = args = null
	}

	return throttled
}

export function onSelector(el, selector, eventType, callback, options) {
	el.addEventListener(
		eventType,
		event => {
			let targetEl = event.target
			while (targetEl && targetEl !== el) {
				if ((targetEl.matches || targetEl.msMatchesSelector).call(targetEl, selector)) {
					callback(event, targetEl)
				}
				targetEl = targetEl.parentElement
			}
		},
		options
	)
}

export default {
	captureAttributeChange,
	dispatchEvent,
	dispatchChange,
	throttleCallback,
	onSelector,
}

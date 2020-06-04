import fastdom from 'fastdom'
import * as EventHelper from 'lib/browser/EventHelper'

const elements = []
let newElements = []
let validateNewElementsRequest, validateRequest, validateTimeout
let stylesLoaded = false

function checkStyles() {
	const content = window
		.getComputedStyle(document.body, ':after')
		.getPropertyValue('content')
		.replace(/['"]+/g, '')
	if (content !== 'loading') {
		// please refer to _styles-abovefold.scss
		stylesLoaded = true
		validateAll()
	} else {
		console.log('🎨 Final styles not yet loaded ...')
		setTimeout(checkStyles, 100)
	}
}

window.visibilityCheckerTime = 0
window.visibilityCheckerCount = 0

document.addEventListener('scroll', validateAll, { passive: true, capture: true })
window.addEventListener('resize', validateAll)
document.addEventListener('visibilitychange', validateSoon)
checkStyles()

function handleMutations(mutations) {
	for (let i = mutations.length - 1; i >= 0; i--) {
		const m = mutations[i]
		if (m.type !== 'attributes' || m.attributeName !== 'style') {
			validateSoon()
			return
		}
	}
	validateLater() // only style attribute changed, we're gonna take it easy
}

if (window.MutationObserver) {
	new MutationObserver(handleMutations).observe(document.body, {
		subtree: true,
		childList: true,
		attributes: true,
	})
	document.body.addEventListener('transitionend', validateLater)
} else {
	setInterval(validateAll, 1000)
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
	)
	newElements.push(el)
	if (!validateNewElementsRequest) {
		validateNewElementsRequest = AnimationFrame.request(validateNew)
	}
}

function remove(el) {
	let index
	index = elements.indexOf(el)
	if (index >= 0) {
		elements.splice(index, 1)
	}
	index = newElements.indexOf(el)
	if (index >= 0) {
		newElements.splice(index, 1)
	}
}

function validateNew() {
	const currentNew = newElements
	newElements = []
	validateNewElementsRequest = null
	elements.push.apply(elements, currentNew)
	validate(currentNew)
}

function validateAll() {
	clearTimeout(validateTimeout)
	validateTimeout = null
	AnimationFrame.cancel(validateRequest)
	validateRequest = null
	validate(elements)
}

function validateSoon() {
	if (!validateRequest) {
		validateRequest = AnimationFrame.request(() => {
			validateAll()
		})
	}
}
function validateLater() {
	if (!validateTimeout) {
		validateTimeout = setTimeout(() => {
			validateAll()
		}, 500)
	}
}

function validate(check) {
	if (!stylesLoaded) return

	fastdom.measure(() => {
		const t = performance.now()
		const elementsBecameVisible = []
		const elementsBecameInvisible = []
		const elementsWillBeRemoved = []

		for (let i = 0, len = check.length; i < len; i++) {
			const el = check[i]
			const options = el.visibilityCheckerOptions || {}
			const visible = isVisible(el, options)
			if (!options.visible && visible) {
				elementsBecameVisible.push(el)
				if (options.notify === 'once') {
					elementsWillBeRemoved.push(el)
				}
			} else if (options.visible && !visible) {
				elementsBecameInvisible.push(el)
				if (options.notify === 'once') {
					elementsWillBeRemoved.push(el)
				}
			}

			options.visible = visible
		}

		window.visibilityCheckerTime += performance.now() - t
		window.visibilityCheckerCount++

		if (elementsBecameVisible.length) {
			notifyVisibility(elementsBecameVisible, true)
		}
		if (elementsBecameInvisible.length) {
			notifyVisibility(elementsBecameInvisible, false)
		}
		if (elementsWillBeRemoved.length) {
			for (let i = elementsWillBeRemoved.length - 1; i >= 0; i--) {
				elements.splice(elements.indexOf(elementsWillBeRemoved[i]), 1)
			}
		}
	})
}

function isVisible(el, options) {
	// this would work with fixed elements too:
	// !!( el.offsetWidth || el.offsetHeight || el.getClientRects().length )
	// see https://jsperf.com/visible-html-el for possible solutions
	if (!options) {
		options = {}
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
		const options = el.visibilityCheckerOptions || {}
		if (options.callback) {
			options.callback(el, visible)
		} else if (options.onshow && visible) {
			options.onshow(el)
		} else if (options.onhide && !visible) {
			options.onhide(el)
		} else {
			EventHelper.dispatchEvent(el, visible ? 'visible' : 'invisible', false)
		}
	})
}

// extent should be between 0 and 2
function isInViewport(element, options) {
	if (typeof options !== 'object') {
		options = {} // extent (>0), direction (both|vertical|horizontal), cover (entire|partial)
	}
	if (typeof options.extent === 'undefined') {
		options.extent = 1.1
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
		partial = options.cover !== 'entire'

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
		hVisible = partial ? hViz > 0 : hViz === 1

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
	const size = element.getBoundingClientRect()
	return 1 - (size.top + size.height) / (window.innerHeight + size.height)
}

export default {
	add,
	remove,
	visible: isVisible,
	progress: viewportProgress,
	invalidate: validateSoon,
}

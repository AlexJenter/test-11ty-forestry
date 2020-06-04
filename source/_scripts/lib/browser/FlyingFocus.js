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

export default FlyingFocus;

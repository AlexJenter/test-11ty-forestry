const Pointer = (() => {
	function Pointer() {}

	const dragEvent = {
		mousedown: ['mousemove', 'mouseup'],
		touchstart: ['touchmove', 'touchend'],
		pointerdown: ['pointermove', 'pointerup'],
		MSPointerDown: ['MSPointerMove', 'MSPointerUp']
	};

	Pointer.dragstart = function(namespace) {
		return addNs('touchstart mousedown pointerdown MSPointerDown', namespace);
	};

	Pointer.dragmove = function(namespace, startEvent) {
		if (startEvent) {
			return addNs(dragEvent[startEvent.type][0], namespace);
		}
		return addNs('touchmove mousemove pointermove MSPointerMove', namespace);
	};
	Pointer.dragend = function(namespace, startEvent) {
		if (startEvent) {
			return addNs(dragEvent[startEvent.type][1], namespace);
		}
		return addNs('touchend mouseup pointerup MSPointerUp', namespace);
	};
	Pointer.getEventPosition = function(event, type) {
		if (!type) {
			type = 'page';
		}
		if (event.originalEvent.touches) {
			return {
				x: event.originalEvent.touches[0][`${type}X`],
				y: event.originalEvent.touches[0][`${type}Y`]
			};
		} else if (event.originalEvent.pageX !== undefined) {
			return {
				x: event.originalEvent[`${type}X`],
				y: event.originalEvent[`${type}Y`]
			};
		}
		return {
			x: event[`${type}X`],
			y: event[`${type}Y`]
		};
	};
	Pointer.isTouchEvent = function(event) {
		if (event) {
			return event.type === 'touchstart' || event.pointerType === 'touch';
		}
		return false;
	};

	function addNs(eventstring, ns) {
		if (!ns) {
			return eventstring;
		}
		const events = eventstring.split(' ');
		for (let i = events.length - 1; i >= 0; i--) {
			events[i] = events[i] + ns;
		}
		return events.join(' ');
	}

	return Pointer;
})();

export default Pointer;

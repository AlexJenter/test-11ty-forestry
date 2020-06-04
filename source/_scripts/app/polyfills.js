import 'nodelist-foreach-polyfill';

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

export default true;

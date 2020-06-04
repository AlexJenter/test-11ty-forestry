/**
 * EventDispatcher
 */
import EventObserver from 'lib/util/EventObserver';

export default class EventDispatcher {
	static get DEFAULT() {
		return 'd_e_f_a_u_l_t';
	}

	addEventListener(event, closure, target) {
		const e = EventDispatcher.extractNamespace(event);
		let observer, index, observers;
		if (typeof this.eventListeners === 'undefined') {
			this.eventListeners = {};
		}
		if (typeof this.eventListeners[e.name] === 'undefined') {
			this.eventListeners[e.name] = {};
		}
		if (typeof this.eventListeners[e.name][e.ns] === 'undefined') {
			this.eventListeners[e.name][e.ns] = [];
		}
		observers = this.eventListeners[e.name][e.ns];
		index = EventDispatcher._index(observers, target, closure);
		if (index < 0) {
			observer = new EventObserver(target, closure);
			observers.push(observer);
		}
		return observer;
	}

	removeEventListener(event, closure, target) {
		let i, listeners;

		if (typeof this.eventListeners === 'undefined') {
			this.eventListeners = {};
		}

		if (!event) {
			for (i in this.eventListeners) {
				this.removeEventListener(i, closure, target);
			}
			return;
		}

		const e = EventDispatcher.extractNamespace(event);
		let name = e.name,
			ns = e.ns;

		if (!name && ns) {
			for (i in this.eventListeners) {
				EventDispatcher._removeEventListener(this.eventListeners[i][ns], target, closure);
			}
			return;
		}

		listeners = this.eventListeners[name];

		if (!closure && !target) {
			if (ns !== EventDispatcher.DEFAULT) {
				listeners[ns] = [];
			} else {
				this.eventListeners[name] = {};
			}
		} else if (ns !== EventDispatcher.DEFAULT) {
			EventDispatcher._removeEventListener(listeners[ns], target, closure);
		} else {
			for (i in listeners) {
				EventDispatcher._removeEventListener(listeners[i], target, closure);
			}
		}
	}

	removeAllEventListeners(value) {
		if (typeof value === 'string') {
			this.removeEventListener(value);
		} else {
			this.removeEventListenersOf(value);
		}
	}

	removeEventListenersOf(target) {
		this.removeEventListener(null, null, target);
	}

	// return false to return false, return anything else (0, '', true, {}, undefined) for true
	trigger(event) {
		let i,
			params = [];
		for (i = 1; i < arguments.length; i++) {
			params.push(arguments[i]);
		}
		let observers,
			callReturn,
			result = true;
		if (typeof this.eventListeners === 'undefined') {
			this.eventListeners = {};
		}
		for (const ns in this.eventListeners[event]) {
			observers = this.eventListeners[event][ns];
			for (i = observers.length - 1; i >= 0; i--) {
				callReturn = observers[i].call(params, this);
				result &= callReturn !== false;
			}
		}
		return result;
	}

	static extractNamespace(event) {
		const index = event.indexOf('.');
		if (index >= 0) {
			return {
				name: event.substr(0, index),
				ns: event.substr(index + 1)
			};
		}
		return {
			name: event,
			ns: EventDispatcher.DEFAULT
		};
	}

	static _index(observers, target, method) {
		for (let i = observers.length - 1; i >= 0; i--) {
			if (observers[i].isEqual(target, method)) {
				return i;
			}
		}
		return -1;
	}

	static _removeEventListener(observers, target, method) {
		let i;
		if (!observers) {
			return;
		}
		if (method) {
			i = EventDispatcher._index(observers, target, method);
			if (i >= 0) {
				observers.splice(i, 1);
			}
		} else {
			for (i = observers.length - 1; i >= 0; i--) {
				if (!target || observers[i].target === target) {
					observers.splice(i, 1);
				}
			}
		}
	}
}

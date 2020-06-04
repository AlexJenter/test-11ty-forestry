/**
 * BaseModule
 */
import EventListener from 'lib/eventlistener/EventListener';

const BaseModule = (function() {
	const namespaces = {};

	return class BaseModule {
		static ns(name) {
			if (!namespaces[name]) {
				namespaces[name] = 0;
			}

			return `.${name}${++namespaces[name]}`;
		}

		constructor() {
			this.el = null;

			this.ns = BaseModule.ns(this.constructor.name);
		}

		init(element) {
			this.el = element;

			return this;
		}

		static _getListenerArguments() {
			let event, selector, handler, target;

			let args = Array.prototype.slice.call(arguments); // copy arguments

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

			event = event.replace(/(\s+|$)/g, `${this.ns}$1`);

			if (selector) {
				return [target, event, selector, handler];
			}

			return [target, event, handler];
		}

		// on(event, selector, handler)
		// on(element, event, selector, handler)
		// on(event, handler)
		// on(element, event, handler)
		on() {
			const args = BaseModule._getListenerArguments.apply(this, arguments);

			EventListener.on.apply(this.el, args);
		}

		one() {
			const args = BaseModule._getListenerArguments.apply(this, arguments);

			EventListener.one.apply(this.el, args);
		}

		trigger(...args) {
			args.unshift(this.el);

			EventListener.trigger.apply(this.el, args);
		}

		off() {
			EventListener.off(this.ns);

			if (this.nstemp) {
				EventListener.off(this.nstemp);
			}
		}

		destroy() {
			this.off();

			if (this.el) {
				// remove event listeners
				this.el = undefined;
			}
		}

		bind(method) {
			const self = this;

			return function() {
				method.apply(self, arguments);
			};
		}
	};
})();

export default BaseModule;

/**
 * Alert
 *
 * @selector .js-Alert
 * @enabled true
 */
import BaseModule from 'app/modules/BaseModule';

export default class Alert extends BaseModule {
	constructor() {
		super();
	}

	init(element) {
		this.el = element;

		this.one('click', () => console.log(this.ns, 'listen once'));

		this.on('mouseenter', () => console.log(this.ns, 'mouseenter'));

		this.on(window, 'resize', () => console.log(this.ns, 'onWindowResize'));
		this.on('click', '.js-Alert--inner', () => console.log(this.ns, '.js-Alert--inner'));
		this.on(document, 'click', '.js-Alert', () => console.log(this.ns, 'global delegate'));

		this.on('click', () => {
			console.log(this.ns, 'element handler');

			this.off(this.ns);

			console.log('goodbye');
		});

		return this;
	}
}

/* eslint-disable */
import contextTrigger from	'lib/util/contextTrigger';
import ModuleManager from 'lib/util/ModuleManager';
import VisibilityChecker from 'lib/browser/VisibilityChecker';


let time = new Date();


function registerElement(selector, cb, options = {}) {
	contextTrigger.add(selector, el => {
		if (options.defer === 'visible') {
			VisibilityChecker.add(el, {
				notify: 'once',
				extent: 1.1,
				onshow: () => cb(el)
			})
		} else {
			cb(el);
		}
	})
}


registerElement('.js-Alert', function initAlert(elem) {
	import('app/modules/global/Alert').then(({ default: Alert }) => {
		ModuleManager.init(Alert, elem);
	});
}, { defer: '' });



contextTrigger.validate(document.body);

console.log("Selecting components took: ", new Date() - time, 'ms');

export default true;

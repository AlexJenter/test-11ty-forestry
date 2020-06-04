/* eslint-disable */
import contextTrigger from	'lib/util/contextTrigger';
import ModuleManager from 'lib/util/ModuleManager';
import VisibilityChecker from 'app/util/VisibilityChecker';


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




contextTrigger.validate(document.body);

console.log("Selecting components took: ", new Date() - time, 'ms');

export default true;

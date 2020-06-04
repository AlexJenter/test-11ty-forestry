/* eslint-disable */
import contextTrigger from	'lib/util/contextTrigger';
import ModuleManager from 'lib/util/ModuleManager';
import VisibilityChecker from 'lib/browser/VisibilityChecker';
<:-
	modules
		.filter(module => ['main', 'header', 'interactive'].indexOf(module.chunk) >= 0)
		.map(module => `import { ${module.name} } from '${module.chunkPath}';`)
		.join('\n');
:>

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

<:
	modules
		.forEach(function(module) {
		if (module.chunk) {
			if (['main', 'header', 'interactive'].indexOf(module.chunk) >= 0) {
:>
registerElement('<:- module.selector :>', function init<:- module.name :>(elem) {
	ModuleManager.init(<:- module.name :>, elem);
}, { defer: '<:- module.defer || "" :>' });
<:
			} else {
:>
registerElement('<:- module.selector :>', function init<:- module.name :>(elem) {
	import('<:- module.chunkPath :>').then(({ <:- module.name :>: <:- module.name :> }) => {
		ModuleManager.init(<:- module.name :>, elem);
	});
}, { defer: '<:- module.defer || "" :>' });
<:
			}
		} else {
:>
registerElement('<:- module.selector :>', function init<:- module.name :>(elem) {
	import('<:- module.path :>').then(({ default: <:- module.name :> }) => {
		ModuleManager.init(<:- module.name :>, elem);
	});
}, { defer: '<:- module.defer || "" :>' });
<:
		}
	});
:>


contextTrigger.validate(document.body);

console.log("Selecting components took: ", new Date() - time, 'ms');

export default true;

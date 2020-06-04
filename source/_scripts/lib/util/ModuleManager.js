import contextTrigger from 'lib/util/contextTrigger';

// every module should at least implement two methods
// Module.init = function( HTMLElement )
// Module.destroy = function()
//
// Modules are per se site specific (if necessary).

const moduleInstances = [];

let garbageCollectedOnInitialise = false;

function initialiseModule(Module, element) {
	// we want old modules garbaged before creating new ones
	if (!garbageCollectedOnInitialise) {
		checkModuleGarbage();
		garbageCollectedOnInitialise = true;
		setTimeout(() => {
			garbageCollectedOnInitialise = false;
		}, 0);
	}

	let module, moduleInstance;
	measureStart();

	try {
		module = new Module();
		moduleInstance = connectModule(module, element);
	} catch (error) {
		console.error('🚨 Cannot initialise module', element);
		console.error(error);
	}

	let moduleName = 'unknown module';
	if (moduleInstance) {
		moduleName = moduleInstance.ns;
	} else if (module) {
		moduleName = module.ns;
	}
	measureStop(moduleName, element);
	return moduleInstance;
}

function connectModule(module, element) {
	const moduleInstance = module.init(element);
	let el;
	if (moduleInstance) {
		el = moduleInstance.el || element;
		el._module = moduleInstance;
		moduleInstance.___el = el;
		moduleInstances.push(moduleInstance);

		let event;
		if (typeof Event === 'function') {
			event = new Event('controllerinit', { bubbles: true });
		} else {
			event = document.createEvent('Event');
			event.initEvent('controllerinit', true, false);
		}
		el.dispatchEvent(event);
	}
	return moduleInstance;
}

function checkModuleGarbage() {
	let elem,
		inst,
		len = moduleInstances.length;
	for (let i = len - 1; i >= 0; i--) {
		inst = moduleInstances[i];
		elem = inst.___el;

		if (!document.documentElement.contains(elem)) {
			try {
				inst.___el = null;
				inst.destroy();
			} catch (e) {}
			moduleInstances.splice(i, 1);
		}
	}
}

// an interval to check wether element have been removed from dom
// if so, we'll find the module instance and call its destroy method
if (typeof window !== 'undefined' && window.MutationObserver) {
	(function() {
		const target = window.document.body;
		const observer = new MutationObserver(mutations => {
			let i;
			const len = mutations.length;
			for (i = 0; i < len; i++) {
				if (mutations[i].removedNodes.length) {
					invalidate();
					break;
				}
			}
		});
		const config = {
			subtree: true,
			childList: true
		};
		observer.observe(target, config);

		let timeout;
		function invalidate() {
			clearTimeout(timeout);
			timeout = setTimeout(validate, 50);
		}
		function validate() {
			clearTimeout(timeout);
			checkModuleGarbage();
		}
	})();
} else {
	setInterval(checkModuleGarbage, 2500);
}

let measureTime,
	totalTime = 0,
	measureTable = [];
function now() {
	return window.performance && performance.now ? performance.now() : new Date();
}
function measureStart() {
	measureTime = now();
}
function measureStop(name, element) {
	totalTime += now() - measureTime;
	measureTable.push({
		Module: name,
		Element: element,
		'Time (ms)': Math.round((now() - measureTime) * 10) / 10
	});
}

setTimeout(() => {
	console.log(`Module init took ${totalTime.toFixed(1)} ms`);

	if (console.table && measureTable.length > 0) {
		console.table(measureTable);
	}
	measureTable = [];
}, 5000);

export default {
	connect(Module, element) {
		initialiseModule(Module, element);
	},
	add(M, selector) {
		if (typeof Module === 'string') {
			throw new Error('Module can not be a string');
		} else {
			contextTrigger.add(selector, function() {
				const elem = this;
				initialiseModule(M, elem);
			});
		}
	},
	checkGarbage: checkModuleGarbage
};

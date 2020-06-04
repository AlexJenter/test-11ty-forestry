let namespaces = {};

function getNamespace(ns) {
	if (!namespaces[ns]) {
		namespaces[ns] = {};
	}

	return namespaces[ns];
}

function getListenerOfSameTypeInNamespace(ns, type) {
	const namespace = getNamespace(ns);

	if (!namespace[type]) {
		namespace[type] = [];
	}

	return namespace[type];
}

export function addListener(node, type, callback) {
	const startOfNs = type.indexOf('.');

	if (startOfNs !== -1) {
		let ns = type.substring(startOfNs, type.length);
		type = type.substring(0, startOfNs);

		let listenerInNamespace = getListenerOfSameTypeInNamespace(ns, type);

		listenerInNamespace.push({
			node: node,
			fn: callback
		});
	}

	return node.addEventListener(type, callback);
}

export function removeListenersByNamespace(namespace) {
	let ns = getNamespace(namespace);

	for (let type in ns) {
		for (let i = 0; i < ns[type].length; i++) {
			let pair = ns[type][i];

			pair.node.removeEventListener(type, pair.fn);
		}
	}

	delete namespaces[namespace];
}

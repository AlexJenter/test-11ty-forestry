import MicroTemplate from 'lib/util/MicroTemplate';
import Config from 'app/Config';

let templates = Config.get('templates') || {};

function add(key, str) {
	templates[key] = str;
}

function get(key) {
	let tpl = templates[key];

	if (!tpl) {
		tpl = document.getElementById(key).innerHTML;
	}
	if (typeof tpl === 'string') {
		tpl = templates[key] = MicroTemplate.convert(tpl);
	}

	return tpl;
}

function render(key, data) {
	const tpl = get(key);

	if (!tpl) {
		return;
	}

	return tpl(data);
}

export default {
	add,
	get,
	render
};

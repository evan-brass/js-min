export default function on(event, handler, options = {}) {
	return function (el, part_kind, _recursive_handler) {
		if (part_kind !== 'attribute') throw new Error('On can only be used with attribute kinds of parts.');
		el.addEventListener(event, handler, options);
	}
}
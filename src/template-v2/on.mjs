export default function on(event, handler, options = {}) {
	return function (el) {
		el.addEventListener(event, handler, options);
	}
}
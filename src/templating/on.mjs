export default function on(event, handler, options = {}) {
	return (target, signal) => {
		if (target.nodeType == Node.COMMENT_NODE) throw new Error('on can only be used in attribute locations.');
		target.addEventListener(event, handler, { signal, ...options });
	};
}
export function on_mult(obj) {
	return (target, signal) => {
		if (target.nodeType == Node.COMMENT_NODE) throw new Error('on_mult can only be used in attribute locations.');
		for (ev in obj) {
			target.addEventListener(ev, obj[ev], { signal });
		}
	};
}
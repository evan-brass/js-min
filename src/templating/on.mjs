export default function on(event, handler, options = {}) {
	return (target, signal) => {
		if (target.nodeType == Node.COMMENT_NODE) throw new Error('On can only be used in attribute locations.');
		target.addEventListener(event, handler, options);
		signal.addEventListener('abort', _ => target.removeEventListener(event, handler));
	};
}
export function on_mult(obj) {
	return (target, signal) => {
		if (target.nodeType == Node.COMMENT_NODE) throw new Error('On can only be used in attribute locations.');
		for (ev in obj) {
			target.addEventListener(ev, obj[ev]);
		}
		signal.addEventListener('abort', _ => {
			for (ev in obj) {
				target.removeEventListener(ev, obj[ev]);
			}
		});
	};
}
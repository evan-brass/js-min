
export default function on(event, handler, options = {}) {
	return (el, signal, kind) => {
		if (kind !== 'attribute') throw new Error('On can only be used in attribute locations.');
		el.addEventListener(event, handler, options);
		signal.addEventListener('abort', _ => el.removeEventListener(event, handler));
	};
}
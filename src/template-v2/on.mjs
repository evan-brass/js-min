export default function on(event, handler, options = {}) {
	return (target, signal) => {
		if (target.nodeType == Node.COMMENT_NODE) throw new Error('On can only be used in attribute locations.');
		target.addEventListener(event, handler, options);
		signal.addEventListener('abort', _ => target.removeEventListener(event, handler));
	};
}
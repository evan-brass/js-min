import { context_later } from '../reactivity/context.mjs';

// Helpers to specify what kind of part we expect
function ec(func) {
	return (el, ...args) => {
		if (el.nodeType !== Node.COMMENT_NODE) {
			throw new Error('Expected a comment node');
		}
		return func(el, ...args);
	};
}
function enc(func) {
	return (el, ...args) => {
		if (el.nodeType === Node.COMMENT_NODE) {
			throw new Error('Expected a non-comment node');
		}
		return func(el, ...args);
	};
}

// Event Handling
export function on(event, handler, options = {}) {
	return enc((target, signal) => {
		target.addEventListener(event, handler, { signal, ...options });
	});
}
export function on_mult(obj) {
	return enc((target, signal) => {
		for (ev in obj) {
			target.addEventListener(ev, obj[ev], { signal });
		}
	});
}

// Text
export function text(func, placeholder = "") {
	return ec((el, signal) => {
		const text = new Text(placeholder);
		el.replaceWith(text);
		signal.addEventListener('abort', () => text.replaceWith(new Comment()));
		return func(new_text => {
			text.data = new_text;
		});
	});
}

export function reactive_text(getter) {
	return text(context_later(set_text => set_text(getter().toString())));
}
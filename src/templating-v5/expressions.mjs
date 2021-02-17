import { use_later } from '../reactivity/use.mjs';

function expect_comment(func) {
	return el => {
		if (el.nodeType !== Node.COMMENT_NODE) {
			throw new Error('Expected a comment node');
		}
		return func(el);
	};
}
function expect_non_comment(func) {
	return el => {
		if (el.nodeType === Node.COMMENT_NODE) {
			throw new Error('Expected a non-comment node');
		}
		return func(el);
	};
}

export function on(event, handler, options) {
	return expect_non_comment(el => {
		el.addEventListener(event, handler, options);
	});
}

export function text(func, placeholder = "") {
	return expect_comment(el => {
		const text = new Text(placeholder);
		el.replaceWith(text);
		return func(new_text => {
			text.data = new_text;
		});
	});
}

export function reactive_text(reactive) {
	return text(use_later(set_text => set_text(reactive.value.toString())));
}
import Trait from '../lib/trait.mjs';

export const Handler = new Trait("A Template Expression");

// A handler is a function from (Parser, init, i) -> init
// That is, it takes the parser, modifies it however and returns a modified init function to be run on instantiation.
// IMPORTANT: A handler method cannot use this.  This is undefined when the handler is called.
export function apply_value(value, el) {
	if (value instanceof Handler) {
		value[Handler](el);
	}

	let kind = typeof value;
	if (value === null || kind === 'undefined') {
		// Do nothing.
		return;
	}
	if (kind === 'bigint' || kind === 'number' || kind === 'symbol' || kind === 'boolean') {
		// Convert most primitives to a string.
		value = value.toString();
		kind = typeof value;
	}
	if (kind === 'string' && el.nodeType === Node.COMMENT_NODE) {
		el.replaceWith(value.toString());
	}
	if (kind === 'function') {
		value(el);
		return;
	}
	if (value instanceof HTMLElement && el.nodeType === Node.COMMENT_NODE) {
		el.replaceWith(value);
	}

	throw new Error("Not sure how to apply this value to this element.");
}
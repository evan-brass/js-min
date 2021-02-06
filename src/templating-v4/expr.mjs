import Trait from '../lib/trait.mjs';

export const Handler = new Trait("A Template Expression");

export default function get_handler(value) {
	if (value instanceof Handler) {
		return Handler.get(value);
	}
	
	const kind = typeof value;
	if (value == null || kind == 'undefined') {
		return function DoNothing(_builder) {};
	}
	if (kind == 'bigint' || kind == 'number' || kind == 'symbol' || kind == 'boolean') {
		return function ToStringAdvance(builder) {
			builder.advance(value.toString());
		};
	}
	if (kind == 'string') {
		return function StringAdvance(builder) {
			builder.advance(value);
		};
	}
	if (kind == 'function') {
		// TODO: Does the function get the builder or does it get an element or something.
	}

	throw new Error("Not sure how to make this value into an expression handler.");
}
import Trait from '../lib/trait.mjs';

export const Handler = new Trait("A Template Expression");

// A handler is a function from (Parser, init, i) -> init
// That is, it takes the parser, modifies it however and returns a modified init function to be run on instantiation.
// IMPORTANT: A handler method cannot use this.  This is undefined when the handler is called.
export function get_handler(value) {
	if (value instanceof Handler) {
		return Handler.get(value);
	}
	
	const kind = typeof value;
	if (value === null || kind === 'undefined') {
		return function DoNothing(_builder, init, _i) { return init; };
	}
	if (kind === 'bigint' || kind === 'number' || kind === 'symbol' || kind === 'boolean') {
		return function ToStringAdvance(builder, init) {
			builder.advance(value.toString());
			return init;
		};
	}
	if (kind === 'string') {
		return function StringAdvance(builder, init) {
			builder.advance(value);
			return init;
		};
	}
	if (kind === 'function') {
		return value;
	}

	throw new Error("Not sure how to make this value into an expression handler.");
}
import Trait from '../lib/trait.mjs';

export const Handler = new Trait("A Template Expression");

// A handler is a function from (Parser, init) -> init
// That is, it takes the parser, modifies it however and returns a modified init function to be run on instantiation.

export default function get_handler(value) {
	if (value instanceof Handler) {
		return Handler.get(value);
	}
	
	const kind = typeof value;
	if (value == null || kind == 'undefined') {
		return function DoNothing(_builder, init) { return init; };
	}
	if (kind == 'bigint' || kind == 'number' || kind == 'symbol' || kind == 'boolean') {
		return function ToStringAdvance(builder, init) {
			builder.advance(value.toString());
			return init;
		};
	}
	if (kind == 'string') {
		return function StringAdvance(builder, init) {
			builder.advance(value);
			return init;
		};
	}
	if (kind == 'function') {
		return value;
	}

	throw new Error("Not sure how to make this value into an expression handler.");
}
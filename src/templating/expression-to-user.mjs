import User from './users/user.mjs';

import sinkReplace from './users/sink-replace.mjs';
import constant from './users/constant.mjs';
import arrayHandle from './users/array-handle.mjs';
import awaitReplace from './users/await-replace.mjs';

// Used to check if the expression handlers were able to convert the expression.  If they can then they return the User.  If they can't then they return their second parameter which is this Unchanged symbol.
// Alternatively, I could do and instanceof User on the result... so I might change it to that in the future.
const Unchanged = Symbol();

// I used to think that the e2u should be passed down along the tree but I'm thinking that instead, you should just get a default e2u and then if you want a different e2u then you need to specify it manually.

export function make_expression_to_user(handlers) {
	return function e2u(expression) {
		if (expression instanceof User) {
			return User.get(expression);
		}
		for (const handler of handlers) {
			const response = handler(expression, Unchanged);
			if (response !== Unchanged) {
				return response;
			}
		}
		throw new Error('Unable to convert the expression to a User using the current expression handlers:', expression);
	};
}
export default make_expression_to_user([
	// By default, handle primative types: string, number, undefined, symbol as constants
	(expr, un) => typeof expr !== 'object' ? constant(expr) : un,
	// By default, handle primative Object types here:
	(expr, un) => 
		(	expr instanceof Number ||
			expr instanceof Boolean ||
			expr instanceof String
		)  ? constant(expr) : un,
	// By default, handle HTMLElements as constants
	(expr, un) => expr instanceof Node ? constant(expr) : un,
	// By default, handle arrays with default array handling
	(expr, un) => expr instanceof Array ? arrayHandle(expr) : un,
	// By default, handle Promises with replacement
	(expr, un) => expr.then ? awaitReplace(expr) : un,
	// By default, handle Async Iterators with replacement
	(expr, un) => expr[Symbol.asyncIterator] ? sinkReplace(expr) : un,
	// By default, handle Iterators by converting them to an array and handling that.
	(expr, un) => expr[Symbol.iterator] ? arrayHandle(Array.from(expr)) : un,
]);
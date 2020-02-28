import User from './user.mjs';

// Used to check if the expression handlers were able to convert the expression.  If they can then they return the User.  If they can't then they return their second parameter which is this Unchanged symbol.
const Unchanged = Symbol();

export default function make_expr2user(handlers) {
	return function e2u(expression) {
		if (expression instanceof User) {
			return User.get(expression);
		}
		for (const handler of handlers) {
			const response = handler(expression, Unchanged, e2u);
			if (response !== Unchanged) {
				return response;
			}
		}
		throw new Error('Unable to convert the expression to a User using the current expression handlers:', expression);
	};
}
import User from './user.mjs';
import constant from './constant.mjs';
import sinkReplace from './sink-replace.mjs';
import awaitReplace from './await-replace.mjs';
import arrayHandle from './array-handle.mjs';

// TODO: Probably split these into two files with better names

// Create a User from some common expressions
export function expression2user(expression) {
    if (!(expression instanceof User)) {
		if (expression) {
			if (expression[Symbol.asyncIterator]) {
				// Sink any streams
				// Default Sink simply replaces the value with each item.  Alternate uses of the items (like appending) would need to be specified manually.  Replace is just the default.
				return sinkReplace(expression);
			} else if (expression.then) {
				// Use replacement for any promises
				return awaitReplace(expression);
			} else if (expression instanceof Array) {
				return arrayHandle(expression);
			}
		}
		return constant(expression);
    } else {
        return User.get(expression);
    }
}

export function verifyUser(user, part) {
	if (!user.acceptTypes.includes(part.type)) {
		throw new Error(`This user acepts types: ${user.acceptTypes.join(', ')} and cannot be bound to a part of type: ${part.type}`);
	}
}
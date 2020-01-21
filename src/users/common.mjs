// @flow

import User from './user.mjs';
import constant from './constant.mjs';
import sinkReplace from './sink-replace.mjs';
import awaitReplace from './await-replace.mjs';
import arrayHandle from './array-handle.mjs';
import { Reactive } from '../reactivity/reactive.mjs';
import reactiveUser from './reactive-user.mjs';

// TODO: Probably split these into two files with better names

// So... I like that this is imperative: We know exactly how expressions will be converted to users throughout the codebase.  But it's not very extensible.  Would it be better to have a registration system?  something like: registerExpressionConverter(test_func, convert_func, priority)
// I don't like the priority though.  An alternative would be to have a context object with an array of converters but then every user needs to know what context it is operating in so that it can call expression2user (or whatever the name ends up being).
// At the very least, this should be an array in some file so that people could edit it / add their own more easily.

// Create a User from some common expressions
export function expression2user(expression) {
    if (!(expression instanceof User)) {
		if (expression ) {
			if (expression instanceof Reactive) {
				return reactiveUser(expression);
			} else if (expression[Symbol.asyncIterator]) {
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
	if (!user.acceptTypes.has(part.type)) {
		throw new Error(`This user acepts types: ${Array.from(user.acceptTypes.values()).join(', ')} and cannot be bound to a part of type: ${part.type}`);
	}
}
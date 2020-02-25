import make_expr2user from './expr2user.mjs';

import sinkReplace from 'users/sink-replace.mjs';
import constant from 'users/constant.mjs';
import arrayHandle from 'users/array-handle.mjs';

import reactiveUser from 'users/reactive-user.mjs';
import { Reactive } from 'reactivity/reactive.mjs';

export default make_expr2user([
	// Handle primative types: string, number, undefined, symbol
	(expr, un, _) => typeof expr !== 'object' ? constant(expr) : un,
	// Handle HTMLElements
	(expr, un, e2u) => expr instanceof Node ? constant(expr) : un,
	// Handle Arrays
	(expr, un, e2u) => expr instanceof Array ? arrayHandle(expr) : un,
	// Handle Promises with replacement by default
	(expr, un, e2u) => expr.then ? awaitReplace(expr) : un,
	// Handle Async Iterators with replacement by default
	(expr, un, e2u) => expr[Symbol.asyncIterator] ? sinkReplace(expr) : un,
	// Handle Iterators by converting them to an array and handling that by default
	(expr, un, e2u) => expr[Symbol.iterator] ? arrayHandle(Array.from(expr)) : un,
	// TODO: Get rid of reactive:
	(expr, un, e2u) => expr instanceof Reactive ? reactiveUser(expr, e2u) : un,
]);
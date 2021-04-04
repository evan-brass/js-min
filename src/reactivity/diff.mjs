import { map } from './computed.mjs';

export const NO_CHANGE = Symbol("This symbol indicates that the value didn't change");

export function diff(source, func) {
	let previous = undefined;
	return map(source, val => {
		const ret = func(previous, val);
		previous = val;
		return ret;
	}, (_a, b) => b !== NO_CHANGE);
}

// Compare a time-squence of arrays and produce the arguments to a splice that converts from one to the next.
export function arr_diff(source) {
	let prev = [];
	return map(source, arr => {
		let index = 0;
		while (index < Math.min(prev.length, arr.length) && arr[index] === prev[index]) ++index;

		let prev_end = prev.length - 1;
		let arr_end = arr.length - 1;
		while (index <= Math.min(prev_end, arr_end) && prev[prev_end] === arr[arr_end]) {
			--prev_end;
			--arr_end;
		}

		prev = arr;

		return [index, prev_end - index + 1, ...arr.slice(index, arr_end + 1)];
	})
}
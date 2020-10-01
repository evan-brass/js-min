import { aquire_waiters, queue_waiters } from "./context.mjs";

export function single(initial) {
	let value = initial;
	let waiters = new Set();
	return {
		get value() {
			aquire_waiters(waiters);

			return value;
		},
		set value(newValue) {
			value = newValue;
			waiters = queue_waiters(waiters);

			return true;
		}
	};
}

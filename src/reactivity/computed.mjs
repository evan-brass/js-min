import { aquire_waiters, queue_waiters } from "./context.mjs";
import use_now from './use.mjs';

const UnInit = Symbol("This computed's value hasn't been created yet.");

export default function computed(calc_func, did_change = (a, b) => a !== b) {
	let value = UnInit;
	let waiters = new Set();
	return {
		get value() {
			if (value === UnInit) {
				use_now(() => {
					// Only recompute if there's people waiting for our value.
					if (waiters.size()) {
						const old = value;
					
						value = calc_func();
						
						// Only update our waiters if our value has changed.
						if (did_change(old, value)) {
							waiters = queue_waiters(waiters);
						}
					} else {
						value = UnInit;
					}
				});
			}

			aquire_waiters(waiters);

			return value;
		}
	};
}
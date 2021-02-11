import { aquire_waiters, queue_waiters } from "./context.mjs";
import use_now from './use.mjs';

const UnInit = Symbol("This computed's calc function needs to be run before producing a value.");

export default function computed(calc_func, did_change = (a, b) => a !== b) {
	let value = UnInit;
	let waiters = new Set();
	return {
		get value() {
			if (value === UnInit) {
				use_now(() => {
					// Only recompute if there's people waiting for our value.
					if (value === UnInit || waiters.size > 0) {
						// If value === UnInit then we know we're being called from the getter.  This is because we only set value to UnInit when we don't run the calc_func which means we won't be collected as a waiter for anything.
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
import { aquire_waiters, queue_waiters } from "./context.mjs";
import use_now from './use.mjs';

const UnInit = Symbol("This computed's calc function needs to be run before producing a value.");

export class Computed {
	_value = UnInit
	_waiters = new Set()
	constructor(calc_func, did_change) {
		this.calc_func = calc_func;
		if (typeof did_change === 'function') {
			this.did_change = _did_change;
		}
	}
	_did_change(a, b) {
		return a !== b;
	}
	get value() {
		if (this._value === UnInit) {
			use_now(() => {
				// Only recompute if there's people waiting for our value.
				if (this._value === UnInit || this._waiters.size > 0) {
					// If value === UnInit then we know we're being called from the getter.  This is because we only set value to UnInit when we don't run the calc_func which means we won't be collected as a waiter for anything.
					const old = this._value;

					this._value = calc_func();

					// Only update our waiters if our value has changed.
					if (did_change(old, this._value)) {
						this._waiters = queue_waiters(this._waiters);
					}
				} else {
					this._value = UnInit;
				}
			});
		}

		aquire_waiters(this._waiters);

		return this._value;
	}
}

export default function computed(calc_func, did_change) {
	return new Computed(calc_func, did_change);
}
import { aquire_waiters, queue_waiters } from "./context.mjs";

export class Single {
	_value = undefined
	_waiters = new Set()
	constructor(initial, did_change) {
		this._value = initial;
		if (typeof did_change === 'function') {
			this._did_change = did_change;
		}
	}
	_did_change(a, b) {
		return a !== b;
	}
	get value() {
		aquire_waiters(this._waiters);

		return this._value;
	}
	set value(new_value) {
		if (this._did_change(this._value, new_value)) {
			this._value = new_value;
			this._waiters = queue_waiters(this._waiters);
		}

		return true;
	}
}

export default function single(initial, did_change) {
	return new Single(initial, did_change);
}
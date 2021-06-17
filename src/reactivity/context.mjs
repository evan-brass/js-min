import { get_or_set_cons } from '../lib/get-or-set.mjs';

const stack = [];

export function context(func, signal = false) {
	const waiter = () => {
		if (!signal || !signal.aborted) {
			stack.push(waiter);
			func();
			if (stack.pop() !== waiter) {
				throw new Error("Detected context stack corruption.");
			}
		}
	};
	waiter();
}

export function context_later(func, signalOrStealLast = false) {
	return (...args) => {
		if (signalOrStealLast === true) {
			signalOrStealLast = args.pop();
		}
		context(func.bind(undefined, ...args), signalOrStealLast);
	};
}

let update_roots = new Set();
let to_update = false;

// This solution may do multiple updates.  But I accept that.
function propagate_changes() {
	for (const waiter of to_update.values()) {
		waiter();
	}
	to_update = false;
	update_roots = new Set();
}

export class WaitSet extends Set {
	last_gen = -1;
	aquire() {
		const current = stack[stack.length - 1];
		if (current !== undefined) {
			this.add(current);
		}
	}
	queue() {
		if (to_update === false) {
			to_update = new Set();
			queueMicrotask(propagate_changes);
		}
		if (update_roots.has(this)) {
			console.log("Detected update cycle.");
			debugger;
			throw new Error("Update cycle.");
		}
		update_roots.add(this);
		for (const waiter of this.values()) {
			to_update.add(waiter);
		}
		this.clear();
	}
}

export class WaitMap extends Map {
	aquire(key) {
		const set = get_or_set_cons(this, key, WaitSet);
		set.aquire();
	}
	queue(key) {
		// TODO: Detect cycles
		const set = this.get(key);
		if (set instanceof WaitSet) {
			set.queue();
		}
	}
}

export function basic_change_detect(a, b) {
	return a !== b;
}
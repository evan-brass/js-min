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

let to_update = false;

// This solution may do multiple updates.  But I accept that.
function propagate_changes() {
	for (const waiter of to_update.values()) {
		waiter();
	}
	to_update = false;
}

export class WaitSet extends Set {
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
		for (const waiter of this.values()) {
			to_update.add(waiter);
		}
		this.clear();
	}
}

export function basic_change_detect(a, b) {
	return a !== b;
}
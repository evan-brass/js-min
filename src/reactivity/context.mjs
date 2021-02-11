const context = [];
let to_update = false

export function push_context(new_context) {
	context.push(new_context);
}
export function pop_context(old_context) {
	if (context.pop() !== old_context) {
		throw new Error("Detected context corruption.")
	}
}

export function aquire_waiters(waiter_set) {
	if (context.length > 0) {
		waiter_set.add(context[context.length - 1]);
	}
}

export function queue_waiters(waiter_set, ...args) {
	if (!to_update) {
		to_update = new Set();
		queueMicrotask(function propagate_changes() {
			const temp = to_update;
			to_update = false;
			for (const waiter of temp.values()) {
				waiter(...args);
			}
		});
	}
	for (const waiter of waiter_set.values()) {
		to_update.add(waiter);
	}
	return new Set();
}
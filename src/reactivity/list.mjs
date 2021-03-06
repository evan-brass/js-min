import { aquire_waiters, queue_waiters, push_context, pop_context } from './context.mjs';

const common = {
	map(func) {
		return map_list(this, func);
	},
	filter(func) {
		return filter_list(this, func);
	}
};

export default function list(...items) {
	let waiters = new Set();

	let arr = items.flat();

	return {
		splice(index, remove_count, ...new_items) {
			const ret = arr.splice(index, remove_count, ...new_items);
			waiters = queue_waiters(waiters, index, remove_count, new_items.length);
			return ret;
		},
		get(index) {
			aquire_waiters(waiters);
			return arr[index];
		},
		all() {
			aquire_waiters(waiters);
			// Please don't mutate this returned value
			return arr;
		},
		// Editing convenience methods:
		push(...items) {
			this.splice(arr.length, 0, ...items);
		},
		pop() {
			// TODO: Fix with good errors:
			return this.splice(arr.length - 1, 1)[0];
		},
		shift() {
			// TODO: Fix with good errors:
			return this.splice(0, 1)[0];
		},
		unshift(...items) {
			this.splice(0, 0, items);
		},

		// Common list -> list conversions:
		...common
	};
}

function map_list(parent_list, func) {
	let waiters = new Set();
	let arr;

	const splice_handler = (index, remove_count, new_count) => {
		push_context(splice_handler);
		
		arr.splice(index, remove_count, ...parent_list.all().slice(index, index + new_count).map(x => func(x)));
		waiters = queue_waiters(waiters, index, remove_count, new_count);

		pop_context(splice_handler);
	};

	push_context(splice_handler);
	arr = parent_list.all().map(x => func(x));
	pop_context(splice_handler);

	return {
		get(index) {
			aquire_waiters(waiters);
			return arr[index];
		},
		all() {
			aquire_waiters(waiters);
			return arr;
		},
		...common
	};
}

function filter_list(parent_list, func) {
	let waiters = new Set();
	let arr = [];
	let index_map;

	const splice_handler = (index, remove_count, new_count) => {
		push_context(splice_handler);
		
		let new_items = [];
		let new_remove_count = index_map.slice(index, index + remove_count).reduce((p, c) => c !== false ? p + 1 : p, 0);
		let new_index = index_map[index] || 0;
		index_map.splice(index, remove_count, ...parent_list.all().slice(index, index + new_count).map(item => {
			if (func(item)) {
				new_items.push(item);
				return new_index + new_items.length - 1;
			} else {
				false
			}
		}));
		arr.splice(new_index, new_remove_count, ...new_items);
		waiters = queue_waiters(waiters, index, remove_count, new_count);

		pop_context(splice_handler);
	};

	push_context(splice_handler);
	index_map = parent_list.all().map(item => {
		if (func(item)) {
			arr.push(item);
			return arr.length - 1;
		} else {
			return false;
		}
	});
	pop_context(splice_handler);

	return {
		get(index) {
			aquire_waiters(waiters);
			return arr[index];
		},
		all() {
			aquire_waiters(waiters);
			return arr;
		},
		...common
	}
}

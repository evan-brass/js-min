import { WaitSet, basic_change_detect } from './context.mjs';

// export function single(initial, did_change = basic_change_detect) {
// 	const set = new WaitSet();
// 	let value = initial;
// 	return {
// 		get value() {
// 			set.aquire();
// 			return value;
// 		},
// 		set value(newValue) {
// 			if (did_change(newValue, value)) {
// 				value = newValue;
// 				set.queue();
// 			}
// 			return true;
// 		}
// 	};
// }
export function single(initial, did_change = basic_change_detect) {
	return setup(multi({
		value: {
			initial, did_change
		}
	}));
}

const WaitSetsHolder = Symbol("Symbol to identify the WaitSet map.");
const ValuesHolder = Symbol("Symbol to identify the values map.");
const DidChangeHolder = Symbol("Symbol to identify the did_change map.");

export function setup(target) {
	target[WaitSetsHolder] = {};
	for (const key in target[ValuesHolder]) {
		target[WaitSetsHolder][key] = new WaitSet();
	}
	target[ValuesHolder] = Object.create(target[ValuesHolder]);

	return target;
}
export function multi(props, target = {}) {
	target[ValuesHolder] = props;
	target[DidChangeHolder] = {};
	for (const key in props) {
		const entry = props[key];
		if (
			typeof entry === 'object' &&
			typeof entry.did_change === 'function' &&
			entry.initial !== undefined
		) {
			target[DidChangeHolder][key] = entry.did_change;
			target[ValuesHolder][key] = entry.initial;
		} else {
			target[DidChangeHolder][key] = basic_change_detect;
		}
	}

	for (const key in props) {
		Object.defineProperty(target, key, {
			get() {
				this[WaitSetsHolder][key].aquire();
				return this[ValuesHolder][key];
			},
			set(newValue) {
				if (this[DidChangeHolder][key](newValue, this[ValuesHolder][key])) {
					this[ValuesHolder][key] = newValue;
					this[WaitSetsHolder][key].queue();
				}
				return true;
			}
		});
	}

	return target;
}
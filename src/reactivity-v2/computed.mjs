import { basic_change_detect, context, WaitSet } from './context.mjs';

const UnInit = Symbol("This symbol means that a computed's value hasn't been computed yet.");

export function computed(calc, did_change = basic_change_detect) {
	const set = new WaitSet();
	let value = UnInit;

	return {
		get value() {
			if (value === UnInit) {
				context(() => {
					if (value === UnInit || set.size > 0) {
						const newValue = calc();
						if (did_change(value, newValue)) {
							value = newValue;
							set.queue();
						}
					} else {
						value = UnInit;
					}
				});
			}
			set.aquire();
			return value;
		}
	};
}
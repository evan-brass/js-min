import { aquire_waiters, queue_waiters } from "./context.mjs";
import use_now from './use.mjs';

const UnInit = Symbol("Values hasn't been created yet.");

export default function single(calc_func) {
	let value = UnInit;
	let waiters = new Set();
	return {
		get value() {
			if (value === UnInit) {
				use_now(() => {
					value = calc_func();

					waiters = queue_waiters(waiters);
				});
			}

			aquire_waiters(waiters);

			return value;
		}
	};
}
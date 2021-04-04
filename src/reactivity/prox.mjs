import { WaitMap } from './context.mjs';
import { get_or_set_cons } from '../lib/get-or-set.mjs';

const waiters = new WeakMap();


// I don't think that did_change works with this.
const handler = {
	get(target, key) {
		const key_map = get_or_set_cons(waiters, target, WaitMap);
		key_map.aquire(key);

		const ret = Reflect.get(...arguments);

		if (typeof ret == 'object') ret = new Proxy(ret, handler);

		return ret;
	},
	set(target, key) {
		const key_map = waiters.get(target);
		if (key_map) key_map.queue(key);

		return Reflect.set(...arguments);
	}
};

export function prox(target = {}) {
	return new Proxy(target, handler);
}
/*
 How do live lists work?
 * Are they Proxys with the array methods being called on the proxy?
 * Are they just a normal array with diffing?
*/
import { WaitSet } from './context.mjs';

const stack = [];

export function live_list(inner = []) {
	const set = new WaitSet();
	return new Proxy(inner, {
		get(target, key, receiver) {
			console.log('Get', key);
			// Is the key the length of the array?
			if (key === 'length') {

			}
			// Is the key an index into the array?
			else if (typeof key === 'string' && Number.parseInt(key) !== NaN) {

			}
			// 
			else {
				// Probably accessing a method on the prototype.
			}
			return Reflect.get(...arguments);
		},
		set(target, key, newValue, receiver) {
			// Is the key the length of the array?
			console.log('Set', key, newValue);
			if (key === 'length') {
			}
			// Is the key an index into the array?
			else if (typeof key === 'string' && Number.parseInt(key) !== NaN) {

			}
			// 
			else {
				// Probably accessing a method on the prototype.
				throw new Error('Live lists can only have their indexes and length set.');
			}
			return Reflect.set(...arguments);
		}
	});
}
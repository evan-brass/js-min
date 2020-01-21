// @flow

import User from './user.mjs';
import ALLTYPES from '../parts/all-types.mjs';

// I don't know what this is for anymore.  It's some kind of.. some kind of what?
// Wait, it runs the function you pass in with a parameter function that uses values on some kind of target thing I guess?  This actually might be a more elegant way to write the calendar cells.
// Ok, I think I remember now.  It builds a model that you can get and set from and the sets are also mapped to the parts that you fill with the prop('<prop name>') user.

export default function component(func) {
	const target = {};
	const values = {};
	const parts = {};
	const prop = name => {
		if (!parts[name]) {
			parts[name] = new Set();
			Object.defineProperty(target, name, {
				get() {
					return values[name];
				},
				set(newValue) {
					values[name] = newValue;
					for (const part of parts[name]) {
						part.update(newValue);
					}
					return true;
				}
			});
		}
		return {
			get [User]() { return this; },
			acceptTypes: ALLTYPES,
			bind(part) {
				parts[name].add(part);
				part.update(values[name]);
			},
			unbind(part) {
				parts[name].delete(part);
				part.clear();
			}
		}
	};
	const result = func(prop);
	// Make the target pass the User from what was returned by the func
	Object.defineProperty(target, User, {
		get() {
			return result[User];
		}
	});
	return target;
}
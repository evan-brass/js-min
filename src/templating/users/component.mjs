import User from './user.mjs';
import ALLTYPES from '../parts/all-types.mjs';

export default function component(func) {
	// TODO: Make these maps:
	const target = {};
	const values = {};
	const parts = {};
	const prop = (name, def_value) => {
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
				if (values[name] !== undefined) {
					part.update(values[name]);
				} else {
					part.update(def_value);
				}
			},
			unbind(part) {
				parts[name].delete(part);
				part.clear();
			}
		};
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
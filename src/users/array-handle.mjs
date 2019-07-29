import User from './user.mjs';
import { expression2user, verifyUser } from './common.mjs';
import ALLTYPES from '../parts/all-types.mjs';

function joinHandle(expressions, part) {
	const shared = new Array(users.length).fill('');
	const users = Array.from(expressions).map(expression2user);
	for (let i = 0; i < users.length; ++i) {
		const fakePart = {
			type: part.type,
			update(newValue) {
				shared[i] = newValue;
				part.update(shared.join(' ')); // I'm pretty sure that both style and attribute-values can use a space between thier array values.
			},
			clear() { this.update(''); }
		}
		const user = users[i];
		verifyUser(user, fakePart);
	}
	return {
		unbind(part) { part.clear(); }
	}
}

export default function arrayHandle(expression) {
	return {
		get [User]() { return this; },
		acceptTypes: ALLTYPES,
		bind(part) {
			switch(part.type) {
				case 'style':
					// Should probably use insertRule and deleteRule instead of array joining, but...
				case 'attribute-value':
					this.internal = joinHandle(expression, part);
				case 'node':
					// TODO: Use something like Array-Instance
				case 'attribute':
					// TODO: Probably bind all the items in the array to the same attribute part.
				default:
					throw new Error("A default array user hasn't been defined for that type of part");
			}
		},
		unbind(part) {
			this.internal.unbind(part);
		}
	}
}
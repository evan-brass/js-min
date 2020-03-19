import User from './user.mjs';
import { verifyUser } from './common.mjs';
import default_expression_to_user from '../expression-to-user.mjs';
import ALLTYPES from '../parts/all-types.mjs';
import NodeArray from './node-array.mjs';

function joinHandle(expressions, part, expression_to_user = default_expression_to_user) {
	const users = Array.from(expressions).map(expression_to_user);
	const shared = new Array(users.length).fill('');
	const fakeParts = [];
	for (let i = 0; i < users.length; ++i) {
		const fakePart = {
			// This makes me wonder what a part even is.  Atribute parts don't have update and here I'm creating a fake style or attribute-value part.  Style parts and these fake ones don't even have element attributes.
			type: part.type,
			update(newValue) {
				shared[i] = newValue;
				part.update(shared.join(' ')); // I'm pretty sure that both style and attribute-values can use a space between their array values.
			},
			clear() { this.update(''); }
		}
		fakeParts.push(fakePart);
		const user = users[i];
		verifyUser(user, fakePart);
	}
	return part => {
		part.unbind();
		for (let i = 0; i < users.length; ++i) {
			const user = users[i];
			const fakePart = fakeParts[i];
			user.unbind(fakePart);
		}
	};
}

function shareHandle(expressions, part, expression_to_user = default_expression_to_user) {
	const users = Array.from(expressions).map(expression_to_user);
	for (const user of users) {
		verifyUser(user, part);
		user.bind(part);
	}
	return part => {
		for (const user of users) {
			user.unbind(part);
		}
	};
}

export default function arrayHandle(expression, expression_to_user = default_expression_to_user) {
	// The problem is that we won't know what type of part we're going to be bound to until we're bound.
	return {
		get [User]() { return this; },
		acceptTypes: ALLTYPES,
		bind(part) {
			switch(part.type) {
				case 'style':
					// Should probably use insertRule and deleteRule instead of array joining, but...
				case 'attribute-value':
					this.unbind = joinHandle(expression, part, expression_to_user);
					break;
				case 'attribute':
					this.unbind = shareHandle(expression, part, expression_to_user);
					break;
				case 'node':
					const nodeArray = new NodeArray(expression, expression_to_user);
					verifyUser(nodeArray, part); // Probably not needed but just in case there's more stuff in verifyUser later
					nodeArray.bind(part);
					this.unbind = nodeArray.unbind.bind(nodeArray);
					break;
				default:
					throw new Error("A default array user hasn't been defined for that type of part");
			}
		},
		unbind(_part) { 
			throw new Error('unbind should have been overridden or bind was not called before unbind'); 
		}
	}
}
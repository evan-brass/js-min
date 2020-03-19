import User from './user.mjs';
import { verifyUser } from './common.mjs';
import default_expression_to_user from '../expression-to-user.mjs';

import ALLTYPES from '../parts/all-types.mjs';

// TODO: Use abort signals instead of this cancel stuff.

export default function awaitReplace(promise, expression_to_user = default_expression_to_user) {
	let user;
	let unbound = false;
	return {
		acceptTypes: ALLTYPES,
		bind(part) {
			promise.then(expression => {
				if (!unbound) {
					user = expression_to_user(expression);
					verifyUser(user, part);
					user.bind(part);
				}
			});
		},
		unbind(part) {
			// TODO: Stop this old cancel stuff.
			promise.cancel && promise.cancel();
			unbound = true;
			part.clear();
			if (user) user.unbind(part);
		},
		get [User]() { return this; }
	}
}
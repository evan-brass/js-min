import User from './user.mjs';
import { verifyUser } from './common.mjs';
import def_e2u from './def-expr2user.mjs';

import ALLTYPES from 'parts/all-types.mjs';

// TODO: Use abort signals instead of this cancel stuff.

export default function awaitReplace(promise, e2u = def_e2u) {
	let user;
	let unbound = false;
	return {
		acceptTypes: ALLTYPES,
		bind(part) {
			promise.then(expression => {
				if (!unbound) {
					user = e2u(expression);
					verifyUser(user, part);
					user.bind(part);
				}
			});
		},
		unbind(part) {
			promise.cancel && promise.cancel();
			unbound = true;
			part.clear();
			if (user) user.unbind(part);
		},
		get [User]() { return this; }
	}
}
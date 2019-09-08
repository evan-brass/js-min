import User from './user.mjs';
import {expression2user, verifyUser} from './common.mjs';
import ALLTYPES from '../parts/all-types.mjs';

export default function awaitReplace(promise) {
	let user;
	let unbound = false;
	return {
		acceptTypes: ALLTYPES,
		bind(part) {
			promise.then(expression => {
				if (!unbound) {
					user = expression2user(expression);
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
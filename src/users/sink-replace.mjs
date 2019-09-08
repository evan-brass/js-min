import User from './user.mjs';
import Swappable from './swappable.mjs';
import {expression2user, verifyUser} from './common.mjs';
import ALLTYPES from '../parts/all-types.mjs';

import {fasync} from '../lib/cancellable.mjs';

export default function sinkReplace(stream) {
	let promise;
	let lastUser;
	return {
		acceptTypes: ALLTYPES,
		bind(part) {
			promise = fasync(async fawait => {
				for await(const expression of stream) {
					const user = expression2user(expression);
					verifyUser(user, part);
					if (lastUser) {
						if (lastUser instanceof Swappable && Swappable.get(lastUser).canSwap(user)) {
							lastUser = Swappable.get(lastUser).doSwap(user);
							continue;
						}
						lastUser.unbind(part);
					}
					user.bind(part);
					lastUser = user;
				}
			})();
		},
		unbind(part) {
			promise.cancel();
			if (lastUser) lastUser.unbind(part);
			part.clear();
		},
		get [User]() { return this; }
	}
}

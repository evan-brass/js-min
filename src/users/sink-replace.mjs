import User from './user.mjs';
import Swappable from './swappable.mjs';
import {expression2user, verifyUser} from './common.mjs';
import ALLTYPES from '../parts/all-types.mjs';

import CancelToken from '../lib/cancellable.mjs';
import NEVER from '../lib/never.mjs';

export default function sinkReplace(stream) {
	// TODO: Make a class and put promise as a private member.
	let promise;
	return {
		acceptTypes: ALLTYPES,
		bind(part) {
			promise = (CancelToken.cancelableAsync(async token => {
				let lastUser;
				try {
					for await(const expression of token.wrapAI(stream)) {
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
				} finally {
					await token.wrap_quiet(NEVER);
					if (lastUser) lastUser.unbind(part);
					part.clear();
				}
			}))();
		},
		unbind(_) {
			promise.cancel();
		},
		get [User]() { return this; }
	}
}

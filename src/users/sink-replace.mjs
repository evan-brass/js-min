import User from './user.mjs';
import Swappable from './swappable.mjs';
import {expression2user, verifyUser} from './common.mjs';
import ALLTYPES from '../parts/all-types.mjs';

export default function sinkReplace(stream) {
	let iteration;
	return {
		acceptTypes: ALLTYPES,
		bind(part) {
			iteration = (async function*(){
				let lastUser;
				try {
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
				} finally {
					if (lastUser) lastUser.unbind(part);
				}
			})();
			iteration.next();
		},
		unbind(part) {
			iteration.return();
			part.clear();
		},
		get [User]() { return this; }
	}
}

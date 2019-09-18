import User from './user.mjs';
import Swappable from './swappable.mjs';
import {expression2user, verifyUser} from './common.mjs';
import ALLTYPES from '../parts/all-types.mjs';

export default function sinkReplace(stream) {
	// TODO: Make a class and put promise as a private member.
	let isBound = false;
	let iteration;
	return {
		acceptTypes: ALLTYPES,
		bind(part) {
			isBound = true;
			let lastUser = false;
			iteration = stream[Symbol.asyncIterator]();
			function handle({value, done}) {
				if (isBound && value != undefined) {
					const user = expression2user(value);
					verifyUser(user, part);

					if (!done) {
						iteration.next().then(handle);
					}

					if (lastUser) {
						if (lastUser instanceof Swappable && Swappable.get(lastUser).canSwap(user)) {
							lastUser = Swappable.get(lastUser).doSwap(user);
							return;
						}
						lastUser.unbind(part);
					}
					user.bind(part);
					lastUser = user;
				}
			}
			iteration.next().then(handle);
		},
		unbind(part) {
			isBound = false;
			iteration.return();
			part.clear();
		},
		get [User]() { return this; }
	}
}

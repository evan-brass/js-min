import User from './user.mjs';
import {expression2user, verifyUser} from './common.mjs';

export default function sinkReplace(stream) {
	let iteration;
	return {
		acceptTypes: ["node", "attribute-value", "attribute"],
		bind(part) {
			iteration = (async function*(){
				let lastUser;
				try {
					for await(const expression of stream) {
						const user = expression2user(expression);
						verifyUser(user, part);
						if (lastUser) lastUser.unbind(part);
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
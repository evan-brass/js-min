import User from './user.mjs';
import { verifyUser, exchange_users } from './common.mjs';
import ALLTYPES from 'parts/all-types.mjs';
import { Reactive } from 'reactivity/reactive.mjs';
import def_e2u from 'users/def-expr2user.mjs';

export default function reactiveUser(reactive, e2u = def_e2u) {
	let part, lastUser;
	const reactiveUser = {
		get depth() {
			return reactive.depth + 1;
		},
		update() {
			const user = e2u(reactive.value);
			verifyUser(user, part);

			// Handle Swapping
			lastUser = exchange_users(lastUser, user, part);
		},
		get [Reactive]() { return this; }
	};
	return {
		acceptTypes: ALLTYPES,
		bind(inPart) {
			part = inPart;
			reactive.depend(reactiveUser);
			reactiveUser.update();
		},
		unbind(part) {
			reactive.undepend(reactiveUser);
			part.clear();
		},
		get [User]() { return this; }
	}
}

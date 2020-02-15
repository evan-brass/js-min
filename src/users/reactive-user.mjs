import User from './user.mjs';
import {expression2user, verifyUser, exchange_users} from './common.mjs';
import ALLTYPES from 'parts/all-types.mjs';
import { Reactive } from 'reactivity/reactive.mjs';

export default function reactiveUser(reactive) {
	let part, lastUser;
	const reactiveUser = {
		get depth() {
			return reactive.depth + 1;
		},
		update() {
			const user = expression2user(reactive.value);
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

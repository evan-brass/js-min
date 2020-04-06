import default_expression_to_user from './expression-to-user.mjs';

import NodePart from './parts/node-part.mjs';
import { verifyUser, exchange_users } from './users/common.mjs';

function make_mount(expression_to_user) {
	return function mount(expression, root = document.body) {
		const temp = new Text();
		root.appendChild(temp);
		const part = new NodePart(temp);
		const user = expression_to_user(expression);
		verifyUser(user, part);

		// Probably not neccessary to handle swapping since there's nothing to swap with but this way it's consistent:
		exchange_users(undefined, user, part);

		return function unmount() {
			exchange_users(user, undefined, part);
			part.remove();
		};
	};
}
const mount = make_mount(default_expression_to_user);
mount.with_expression_to_user = make_mount;

export default mount;
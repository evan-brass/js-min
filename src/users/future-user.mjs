import awaitReplace from './await-replace.mjs';

export default function futureReplace(future) {
	const user = awaitReplace(future);
	const oldUnbind = user.unbind;
	user.unbind = part => {
		future.cancel();
		oldUnbind(part);
	};
	return user;
}
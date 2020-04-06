import User from './user.mjs';

export default function ref(callback) {
	const controller = new AbortController();
	return {
		acceptTypes: new Set(['attribute']),
		get [User] () {
			return this;
		},
		bind(part) {
			callback(part.element, controller.signal);
		},
		unbind() {
			controller.abort();
		}
	};
}
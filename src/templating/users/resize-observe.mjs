import User from './user.mjs';

export default function resizeObserve(observer, options = {}) {
	return {
		acceptTypes: new Set(['attribute']),
		bind(part) {
			observer.observe(part.element, options);
		},
		unbind(part) {
			observer.unobserve(part.element, options);
		},
		get [User]() { return this; }
	};
}
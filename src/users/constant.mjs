// @flow

import User from './user.mjs';
import ALLTYPES from '../parts/all-types.mjs';

const Base = {
	get [User]() { return this; },
	acceptTypes: ALLTYPES,
	value: null,
	bind(part) {
		part.update(this.value);
	},
	unbind(part) {
		// part.clear();
	}
}

export default function constant(value) {
	const user = Object.create(Base);
	user.value = value;
    return user;
}
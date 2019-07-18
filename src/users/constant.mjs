import User from './user.mjs';
import ALLTYPES from '../parts/all-types.mjs';

export default function constant(value) {
    return {
        get [User]() { return this; },
        acceptTypes: ALLTYPES,
        bind(part) {
            part.update(value);
        },
        unbind(part) {
			part.clear();
		}
    };
}
import User from './user.mjs';
import ALLTYPES from '../parts/all-types.mjs';

export default function constant(value) {
    return {
        get [User]() { return this; },
        acceptTypes: ALLTYPES,
        bind(part) {
            part.update(value);
        },
        unbind(_part) {
			// So, too often, parts are being double updated, once with the old value and once with the new.
			// part.clear();
		}
    };
}
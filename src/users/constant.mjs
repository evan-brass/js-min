import User from './user.mjs';

export default function constant(value) {
    return {
        get [User]() { return this; },
        acceptTypes: ['node', 'attribute', 'attribute-value'],
        bind(part) {
            part.update(value);
        },
        unbind(part) {
			part.clear();
		}
    };
}
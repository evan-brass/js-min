// @flow

import User from './user.mjs';

export default function ref(callback) {
    return {
        acceptTypes: new Set(['attribute']),
        get [User] () {
            return this;
        },
        bind(part) {
            callback(part.element);
        },
        unbind() {}
    };
}
// @flow

import User from './user.mjs';

// This is just like on except for adding an abject of listeners to an element instead of a single handler

// MAYBE: Switch to class?  So that those functions would be on a shared prototype?
export default function on_mult(object) {
    let element;
    return {
        acceptTypes: new Set(['attribute']),
        get [User] () {
            return this;
        },
        bind(part) {
			element = part.element;
			for (let event in object) {
				element.addEventListener(event, object[event]);
			}
        },
        unbind() {
			for (let event in object) {
				element.removeEventListener(event, object[event]);
			}
        }
    };
}
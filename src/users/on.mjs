import User from './user.mjs';

// MAYBE: Switch to class?  So that those functions would be on a shared prototype?
export default function on(event, callback) {
    let element;
    return {
        acceptTypes: new Set(['attribute']),
        get [User] () {
            return this;
        },
        bind(part) {
            element = part.element;
            element.addEventListener(event, callback);
        },
        unbind() {
            element.removeEventListener(event, callback);
        }
    };
}
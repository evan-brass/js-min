import Instance from './instance.mjs';

// This is a standard library of common expressions

export function s(value) { // s is short for static.  This value is not going to change
    return {
        get [Instance.PartUser]() { return this; },
        acceptTypes: ['node', 'attribute', 'attribute-value'],
        bind(part) {
            part.update(value);
        },
        unbind(part) {

        }
    };
}

export function on(event, callback) {
    let element;
    return {
        acceptTypes: ['attribute'],
        get [Instance.PartUser] () {
            return this;
        },
        bind(part) {
            element = part.element;
            element.addEventListener(event, callback);
        },
        unbind(part) {
            element.removeEventListener(event, callback);
        }
    };
}
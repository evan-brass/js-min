import { PartUser } from './instance.mjs';
import { Returnable } from './parts/index.mjs';
// This is a standard library of common expressions

export function s(value) { // s is short for static.  This value is not going to change
    return {
        get [PartUser]() { return this; },
        acceptTypes: ['node', 'attribute', 'attribute-value'],
        bind(part) {
            part.update(value);
        },
        unbind() {

        }
    };
}

export function mount(instance, root = document.body) {
    if (instance instanceof Returnable) {
        root.appendChild(Returnable.get(instance).getFragment());
    } else {
        throw new Error("Mount expects something that's returnable.");
    }
}

export function on(event, callback) {
    let element;
    return {
        acceptTypes: ['attribute'],
        get [PartUser] () {
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
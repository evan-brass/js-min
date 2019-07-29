import Part from './part.mjs';

// Mostly I think that attribute parts will be used to access a perticular node so the whole attribute update mechanism should maybe go.
export default class AttributePart extends Part {
    constructor(element) {
        super("attribute", element);
    }
    update(_newValue) {
		throw new Error("Attribute parts aren't intended to be updated.  They are intended to be used as a way of accessing a specific element.  It's used by on, ref, and other users.");
    }
    clear() {}
}
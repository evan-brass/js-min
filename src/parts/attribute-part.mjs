import Part from './part.mjs';

// Mostly I think that attribute parts will be used to access a perticular node so the whole attribute update mechanism should maybe go.
export default class AttributePart extends Part {
    constructor(element) {
        super("attribute", element);
    }
    update(newValue) {
		// TODO: Remove the whole object of properties thing.  I've only ever used attribute parts as a way of accessing an element (for event listeners and things).  That would make this the first part which doesn't really make sence to have an update function on.  Does this have implications else where?
        if (newValue instanceof Object) {
            for (const attrName in newValue) {
                this.element.setAttribute(attrName, newValue[attrName]);
            }
        } else {
            throw new Error("Currently, AttributeParts only know how to assign an object of properties.");
        }
    }
    clear() {}
}
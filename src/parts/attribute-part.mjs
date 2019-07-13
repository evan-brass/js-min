import Part from './part.mjs';

// Mostly I think that attribute parts will be used to access a perticular node so the whole attribute update mechanism should maybe go.
export default class AttributePart extends Part {
    constructor(element) {
        super("attribute", element);
    }
    update(newValue) {
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
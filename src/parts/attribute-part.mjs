import Part from './part.mjs';

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
}
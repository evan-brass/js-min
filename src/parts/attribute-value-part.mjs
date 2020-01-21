// @flow

import Part from './part.mjs';

export default class AttributeValuePart extends Part {
    constructor(element, attributeName, shared, sharedIndex) {
        super("attribute-value", element);
        this.attributeName = attributeName;
        this.shared = shared;
        this.sharedIndex = sharedIndex;
    }
    update(newValue) {
        this.shared[this.sharedIndex] = newValue;
        this.element.setAttribute(this.attributeName, this.shared.join(''));
    }
    clear() {
        this.update('');
    }
}
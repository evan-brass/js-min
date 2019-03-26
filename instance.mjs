const NodePart = {
	el: null,
	type: 'node',
	update(value) {
		if (!(value instanceof HTMLElement)) {
			value = new Text(value);
		}
		this.el.replaceWith(value);
		this.el = value;
	}
};
const AttributePart = {
	// TODO: 
};
const AttributeValuePart = {
	shared: null,
	index: -1,
	attrName: null,
	el: null,
	update(value) {
		this.shared[this.index] = value;
		this.el.setAttribute(this.attrName, this.shared.join(''));
	}
};

export default class TemplateInstance {
    constructor(fragment, parts) {
        this._fragment = fragment;
        this.parts = parts;
    }
    get fragment() {
        const frag = this._fragment;
        if (frag) {
            this._fragment = false;
            return frag;
        } else {
            throw new Error("Fragment must be returned (aka. set) before it can be retreived again.");
        }
    }
    set fragment(newVal) {
        this._fragment = newVal;
    }
}
/**
 * One reason to have a template-instance class is because there's cool tricks that can be done with instances that I want
 * to enable.  For example, if two instances are from the same template, and you're trying to swap them out, then you can 
 * trade the parts on them, and update the parts with the new values.  This updates the DOM from the first instance with 
 */
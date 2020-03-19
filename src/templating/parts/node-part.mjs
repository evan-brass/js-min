import Trait from "lib/trait.mjs";
import Part from "./part.mjs";

// Should returnable be manual with bind and unbind?
export const Returnable = new Trait("Returnable", {
    getFragment() {
        if (this._fragment) {
            const frag = this._fragment;
            this._fragment = null;
            return frag;
        } else {
            throw new Error("Fragment is already on loan.");
        }
    },
    returnFragment(fragment) {
        if (!this._fragment) {
            this._fragment = fragment;
        } else {
            throw new Error("Fragment is already returned.");
        }
    }
});
export default class NodePart extends Part {
    constructor(element) {
        const text = new Text();
        element.replaceWith(text);
        super("node", text);
        this.mode = 'unframed';
        this.currentValue = false;
        this.before = null;
        this.after = null;
    }
    remove() {
        this.cleanFramed();
        this.makeUnframed();
        this.element.remove();
    }
    // TODO: Need to use comments for the framing instead of text nodes so that if we render server side then we can pull out the existing contents even though there won't be the hidden text nodes.
    makeFramed() {
        if (this.mode != "framed") {
            this.before = new Text();
            this.after = new Text();
            this.element.replaceWith(this.before, this.after);
            this.element = null;
            this.mode = "framed";
        }
    }
    makeUnframed() {
        if (this.mode != "unframed") {
            this.element = this.before;
            this.after.remove();
            this.before = null;
            this.after = null;
            this.mode = "unframed";
        }
	}
	packageForMove() {
		const frag = new DocumentFragment();
		if (this.mode == "framed") {
            while(this.before.nextSibling != this.after) {
                frag.appendChild(this.before.nextSibling);
			}
			frag.insertBefore(this.before, frag.firstChild);
			frag.appendChild(this.after);
		} else if (this.mode == "unframed") {
			frag.appendChild(this.element);
		} else {
			throw new Error("Don't know how to package a node part of mode:", this.mode);
		}
		return frag;
	}
    cleanFramed() {
        if (this.mode == "framed") {
            const returnFrag = document.createDocumentFragment();
            while(this.before.nextSibling != this.after) {
                returnFrag.appendChild(this.before.nextSibling);
            }
            if (this.lender) {
                this.lender.returnFragment(returnFrag);
                this.lender = false;
            }
        }
    }
    update(newValue) {
		function convertToNode(value) {
            if (value === undefined) {
                return new Text();
            } else if (
				value instanceof Returnable || 
				value instanceof DocumentFragment || 
				value instanceof HTMLElement
			) {
                return value;
            } else {
                return new Text(value);
            }
        }
		// By default only update if the value is different.
		if (this.currentValue !== newValue) {
			this.cleanFramed();
			let node = convertToNode(newValue);
			if (node instanceof Returnable) {
				this.lender = Returnable.get(node);
				node = this.lender.getFragment();
			}
			if (node instanceof DocumentFragment) {
				this.makeFramed();
				this.after.parentNode.insertBefore(node, this.after);
			} else {
				this.makeUnframed();
				this.element.replaceWith(node);
				this.element = node;
			}
			this.currentValue = newValue;
		}
    }
    clear() {
		// TODO: Fix swapping
        this.update("");
	}
	// Helper for manipulating nodeParts and making new ones relative to one
	insertBefore(node) {
		if (this.mode == "framed") {
			this.before.parentNode.insertBefore(node, this.before);
		} else if (this.mode == "unframed") {
			this.element.parentNode.insertBefore(node, this.element);
		} else {
			throw new Error("Unknown mode: ", this.mode);
		}
	}
	insertAfter(node) {
		if (this.mode == "framed") {
			this.before.parentNode.insertBefore(node, this.after.nextSibling);
		} else if (this.mode == "unframed") {
			this.element.parentNode.insertBefore(node, this.element.nextSibling);
		} else {
			throw new Error("Unknown mode: ", this.mode);
		}
	}
}
import Trait from "../trait.mjs";
import Part from "./part.mjs";

export const Returnable = new Trait("Object must implement the Returnable interface: https://github.com/evan-brass/js-min/wiki/Trait:-Returnable", {
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
// Might need to move swapping higher up the chain.
export const SelfUpdate = new Trait("Object must implement the SelfUpdate Interface: not specified anywhere yet.", {
    update(newValue, defaultUpdate) {
        return defaultUpdate(newValue);
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
    cleanFramed() {
        if (this.mode == "framed") {
            const returnFrag = document.createDocumentFragment();
            while(this.before.nextSibling != this.after) {
                returnFrag.appendChild(this.before.nextSibling);
            }
            if (this.currentValue instanceof Returnable) {
                this.currentValue.returnFragment(returnFrag);
                this.currentValue = false;
            }
        }
    }
    defaultUpdate(newValue) {
        function convertToNode(value) {
            if (value === undefined) {
                return new Text();
            } else if (['string', 'number', 'boolean'].includes(typeof value)) {
                return new Text(value);
            } else if (value[Symbol.iterator]) {
                const fragment = document.createDocumentFragment();
                for (const item of value) {
                    fragment.appendChild(convertToNode(item));
                }
                return fragment;
            } else {
                return value;
            }
        }
        this.cleanFramed();
        let node = convertToNode(newValue);
        if (node instanceof Returnable) {
            const lender = Returnable.get(node);
            node = lender.getFragment();
            this.lender = lender;
        }
        if (node instanceof DocumentFragment) {
            this.makeFramed();
            this.after.parentNode.insertBefore(node, this.after);
        } else {
            this.makeUnframed();
            this.element.replaceWith(node);
            this.element = node;
        }
        return newValue;
    }
    update(newValue) {
        if (this.currentValue instanceof SelfUpdate) {
            this.currentValue = SelfUpdate.get(this.currentValue).update(newValue, this.defaultUpdate.bind(this));
        } else {
            // By default only update if the value is different.
            if (this.currentValue !== newValue) {
                this.currentValue = this.defaultUpdate(newValue);
            }
        }
    }
}
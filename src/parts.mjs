import Trait from "./trait.mjs";

export class Part {
    constructor(type, element) {
        this.type = type;
        this.element = element;
    }
    update() {
        throw new Error("Update should be overriden.");
    }
}
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
export class NodePart extends Part {
    constructor(element) {
        const text = new Text();
        element.replaceWith(text);
        super("node", text);
        this.mode = 'unframed';
        this.currentValue = false;
        this.before = null;
        this.after = null;
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
            if (['string', 'number', 'boolean'].includes(typeof value)) {
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
        this.cleanFramed(); // TODO: Need swapping here (something like should update).
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
export class AttributePart extends Part {
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
export class AttributeValuePart extends Part {
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
}
export function *createParts(commentNode) {
    let parsed;
    try {
        // MAYBE: Maybe find a better way of determining if it's JSON or not.
        parsed = JSON.parse(commentNode.data);
    } catch(e) {
        // If the Comment's data isn't JSON parsable, then it's not ours.
        if (e instanceof SyntaxError) return;
        // MAYBE: Check the syntax error to make sure that it's due to the contents not being JSON, and not some other SyntaxError.
        // If it's something other than a Syntax Error then don't catch it.
        else throw e;
    }
    // TODO: Handle if the comment's contents is JSON but isn't one of our parts
    if (parsed.type == undefined) {
        // Must be an object with Attribute parts
        for (const part of parsed.parts) {
            // Might be able to be just nextSibling, but I think nextElementSibling is safer
            const element = commentNode.nextElementSibling;
            if (part.sharedIndex != undefined) {
                yield new AttributeValuePart(element, part.attrName, parsed.shared[part.sharedIndex], part.index);
            } else {
                yield new AttributePart(element);
            }

        }
        commentNode.remove();
    } else if (parsed.type = "node") {
        yield new NodePart(commentNode);
    }
}
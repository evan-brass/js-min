export class Part {
    constructor(type, element) {
        this.type = type;
        this.element = element;
    }
    update() {
        throw new Error("Update should be overriden.");
    }
}
const Returnable = Symbol("Object must implement the Part.Returnable interface.");
export class NodePart extends Part {
    constructor(element) {
        const text = new Text();
        element.replaceWith(text);
        super("node", text);
        this.mode = 'unframed';
        this.lender = false;
        this.before = null;
        this.after = null;
    }
    // TODO: Replace with class property
    static get Returnable() {
        return Returnable;
    }
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
            if (this.lender) {
                this.lender.returnFragment(returnFrag);
                this.lender = false;
            }
        }
    }
    update(newValue) {
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
        this.cleanFramed();
        let node = convertToNode(newValue);
        let lender = node[NodePart.Returnable];
        if (lender) {
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
        parsed = JSON.parse(commentNode.data);
    } catch(e) {
        // If the Comment's data isn't JSON parsable, then it's not ours.
        if (e instanceof SyntaxError) return;
        // Only catch errors indicating that the 
        else throw e;
    }
    // TODO: Handle if the comment's contents is JSON but doesn't have parts in it.
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
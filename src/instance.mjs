import Template from './template.mjs';
import {createParts, NodePart} from './parts.mjs';
import Trait from './trait.mjs';

export const PartUser = new Trait("Object must implement the PartUser interface as described here: https://github.com/evan-brass/js-min/wiki/Trait:-Part-User", {
    acceptTypes: ['node'],
    bind(part) {
        throw new Error("PartUser: No default implementation for bind.");
    },
    unbind(part) {
        throw new Error("PartUser: No default implementation for unbind.")
    }
});

export default class Instance {
    // TODO: Replace with class property
    static get instancePools() {
        if (!this._instancePools) {
            this._instancePools = new Map();
		}
		return this._instancePools;
    }
	static getInstance(strings) {
        const template = Template.getTemplate(strings);
        if (!this.instancePools.has(template)) {
            this.instancePools.set(template, []);
        }
        const pool = this.instancePools.get(template);
        if (pool.length > 0) {
            return pool.pop();
        } else {
            return new Instance(template);
        }
	}
    
	*getComments(node) {
		const walker = document.createTreeWalker(node, NodeFilter.SHOW_COMMENT);
		while(walker.nextNode()) {
			yield walker.currentNode;
		}
	}
	// MAYBE: Move this into TemplateInstance?
	parseParts() {
		this.parts = [];
		for (const comment of Array.from(this.getComments(this._fragment))) {
			for (const part of createParts(comment)) {
                this.parts.push(part);
            }
        }
	}
    constructor(template) {
        this.template = template;
        this._fragment = template.instantiate();
        this.users = [];
        this.parseParts();
    }

    connect(expressions) {
        if (expressions.length != this.parts.length) {
            throw new Error("Number of expressions is not the same as the number of available parts.");
        }
        for (let i = 0; i < expressions.length; ++i) {
            const expression = expressions[i];
            const part = this.parts[i];
            const user = expression[Instance.PartUser];
            if (user) {
                this.users.push(user);
                if (user.acceptTypes.includes(part.type)) {
                    user.bind(part);
                } else {
                    throw new Error("That user doesn't accept the corrisponding type of part.");
                }
            } else {
                // If the expression doesn't implement the user interface, then just try and update the part with the expression directly.
                part.update(expression);
            }
        }
    }
    disconnect() {
        for (const user of this.users) {
            user.unbind();
        }
        this.users.length = 0;
    }

    // Implement the Returnable Interface
    get [NodePart.Returnable]() { return this; }
    getFragment() {
        const frag = this._fragment;
        if (frag) {
            this._fragment = false;
            return frag;
        } else {
            throw new Error("Fragment must be returned (aka. set) before it can be retreived again.");
        }
    }
    returnFragment(frag) {
        // This is called when whoever had the instance is done with it.  We can clean it up and...
        this._fragment = frag;
        this.disconnect();
        // ...return this instance into the proper pool.
        Instance.instancePools.get(this.template).push(this);
    }

    // Implement the PartUser Interface
    get [PartUser] () { return this; }
    get acceptTypes() { return  ['node']; }
    bind(part) {
        part.update(self);
    }
    unbind(part) {

    }
}
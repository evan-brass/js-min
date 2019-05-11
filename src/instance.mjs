import {createParts, NodePart, Returnable} from './parts.mjs';
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
    constructor() {
        this.users = [];
		this.parts = [];
    }
    // Implement the Returnable Interface
    get [Returnable]() { return this; }
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
        if (this.autoPool) {
            this.disconnect();
            // ...return this instance into the proper pool.
            this._pool.push(this);
        }
    }

    // Implement the PartUser Interface
    get [PartUser] () { return this; }
    get acceptTypes() { return  ['node']; }
    bind(part) {
        part.update(this);
    }
    unbind() {

    }
}

export class TemplateInstance extends Instance {
	*getComments(node) {
		const walker = document.createTreeWalker(node, NodeFilter.SHOW_COMMENT);
		while(walker.nextNode()) {
			yield walker.currentNode;
		}
	}
	// MAYBE: Move this into TemplateInstance?
	parseParts() {
		for (const comment of Array.from(this.getComments(this._fragment))) {
			for (const part of createParts(comment)) {
                this.parts.push(part);
            }
        }
	}
    constructor(template) {
        super();
        this.autoPool = false;
        this._fragment = document.importNode(template.content, true);
        this.parseParts();
    }
    configurePooling(pool) {
        this._pool = pool;
        this.autoPool = true;
        return this;
    }

    connect(expressions) {
        if (expressions.length != this.parts.length) {
            throw new Error("Number of expressions is not the same as the number of available parts.");
        }
        for (let i = 0; i < expressions.length; ++i) {
            const expression = expressions[i];
            const part = this.parts[i];
            if (expression instanceof PartUser) {
                const user = PartUser.get(expression);
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
}
export class ArrayInstance extends Instance {
    constructor(expressions) {
        super();
        this._fragment = new DocumentFragment();
        for (const expr of expressions) {
            const text = new Text();
            this._fragment.appendChild(text);
            const part = new NodePart(text);
            this.parts.push(part);
            if (expr instanceof PartUser) {
                PartUser.get(expr).bind(part);
            } else {
                part.update(expr);
            }
        }
    }
    // TODO: Wrappers + animations, implement enough to allow the normal map functions to be called on it (reverse, sort, etc)
}

export const InstancePools = new WeakMap();

export function getTemplateInstance(template) {
    if (!InstancePools.has(template)) {
        InstancePools.set(template, []);
    }
    const pool = InstancePools.get(template);
    if (pool.length > 0) {
        return pool.pop();
    } else {
        return new TemplateInstance(template).configurePooling(pool);
    }
}
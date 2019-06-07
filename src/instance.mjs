import {createParts, NodePart, Returnable, SelfUpdate } from './parts/index.mjs';
import Trait from './trait.mjs';
import ObservableArray from './observable-array.mjs';
import doInFrameOnce from './do-in-frame-once.mjs';

export const PartUser = new Trait("Object must implement the PartUser interface as described here: https://github.com/evan-brass/js-min/wiki/Trait:-Part-User", {
    acceptTypes: ['node'],
    bind(part) {
        throw new Error("PartUser: No default implementation for bind.");
    },
    unbind() {
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
    unbind() {}
}

export class TemplateInstance extends Instance {
	*getComments(node) {
		const walker = document.createTreeWalker(node, NodeFilter.SHOW_COMMENT);
		while(walker.nextNode()) {
			yield walker.currentNode;
		}
	}
	// MAYBE: Move this into parts somehow?
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
        this.template = template; // Used for swapping later on.
        this.isBound = false;
    }
    configurePooling(pool) {
        this._pool = pool;
        this.autoPool = true;
        return this;
    }
    bind(part) {
        if (!this.isBound) {
            this.bindUsers();
        }
        part.update(this);
    }

    bindUsers() {
        // Binding is differed to an animation frame largely because I want to not bind then unbind if we set the expressions and then end up swapping with another instance that's already in place.
        if (!this._bindAF) {
            this._bindAF = requestAnimationFrame(() => {
                for (let i = 0; i < this.parts.length; ++i) {
                    const user = this.users[i];
                    const part = this.parts[i];
                    if (this.isBound) {
                        user.unbind();
                    }
                    user.bind(part);
                }
                this.isBound = true;
                this._bindAF = false;
            });
        }
    }
    verifyExpressions(expressions) {
        const newUsers = [];
        if (expressions.length != this.parts.length) {
            throw new Error("Number of expressions is not the same as the number of available parts.");
        }
        for (let i = 0; i < expressions.length; ++i) {
            const expression = expressions[i];
            const part = this.parts[i];
            if (expression instanceof PartUser) {
                const user = PartUser.get(expression);
                newUsers.push(user);
                if (!user.acceptTypes.includes(part.type)) {
                    throw new Error("That user doesn't accept the corrisponding type of part.");
                }
            } else {
                throw new Error("Must be a PartUser to be bound to a part.");
            }
        }
        this.users = newUsers; // Don't mess with users until we know that all parts are good
    }
    connect(expressions) {
        this.verifyExpressions(expressions);
        this.bindUsers();
    }
    disconnect() {
        for (const user of this.users) {
            user.unbind();
        }
        this.users.length = 0;
    }    

    swap(newParts) {
        const oldParts = this.parts;
        this.parts = newParts;
        this.bindUsers(); // Need to bind users to the instance that we're replacing.
        return oldParts;
    }

    // Implement the Self Update functionality to catch swapping an instance with an instance derived from the same template
    get [SelfUpdate]() {return this; }
    update(newValue, defaultUpdate) {
        if (newValue instanceof Instance && newValue.template == this.template) {
            // If we're already bound (most likely the case) then unbind our parts before handing them over to the other person.
            if (this.isBound) {
                for (const user of this.users) {
                    user.unbind();
                }
            }
            // Perform the swap:
            this.parts = newValue.swap(this.parts);
            console.log('Performed a swap.')
            return newValue;
        } else {
            return defaultUpdate(newValue);
        }
    }
}
export class ArrayInstance extends Instance {
    constructor(expressions = []) {
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
        const observableArray = new ObservableArray();
        observableArray.callback = doInFrameOnce.bind(this, () => {
            // TODO: Update the dom with the changes made to the array
        });
        this.arr = observableArray.proxy;
    }
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
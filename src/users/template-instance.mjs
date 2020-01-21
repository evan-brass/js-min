// @flow

import {Returnable} from '../parts/node-part.mjs';
import createParts from '../parts/create-parts.mjs';
import User from './user.mjs';
import {expression2user, verifyUser} from './common.mjs';
import Swappable from './swappable.mjs';

import MetaRoot from '../introspection.mjs';

const Meta = {
	swapCount: 0
};
MetaRoot.templateInstance = Meta;

const lenderBase = {
	getFragment() {
		if (!this.owningInstance.isBound) {
			// TODO: Would be nice to not need the owningInstance
			throw new Error("Should be bound before we are asked for our fragment.");
		}
		const frag = this.fragment;
		if (frag) {
			this.fragment = false;
			return frag;
		} else {
			throw new Error("Fragment must be returned (aka. set) before it can be retreived again.");
		}
	},
	returnFragment(frag) {
		// This is called when whoever had the instance is done with it.  We can clean it up and...
		this.fragment = frag;
	}
};

// The debug wrapper is a div that wraps the actual template instance and displays some debug information
const ShowDebugWrapper = false;
class DebugWrapper {
	constructor(target) {
		target.style = `
			position: absolute;
			transform: translatey(-100%);
			border: 1px solid #27474e;
			background-color: #ffffff11;
			transition: background-color .5s;
		`;
		this.target = target;
		this.pooledCount = 0;
		this.swappedCount = 0;
		this.update();
	}
	pooled() {
		++this.pooledCount;
		this.update();
	}
	swapped() {
		++this.swappedCount;
		this.update();
	}
	update() {
		this.target.innerText = `Pooled ${this.pooledCount} times; swapped ${this.swappedCount} times`;
	}
}

export default class TemplateInstance {
    constructor(template) {
        this.users = [];
        this.parts = [];

        this.autoPool = false;

		this.lender = Object.create(lenderBase);
		let fragment = document.importNode(template.content, true);
		if (ShowDebugWrapper) {
			const wrapper = document.createElement('div');
			fragment.insertBefore(wrapper, fragment.firstChild);
			this.debugWrapper = new DebugWrapper(wrapper);
		}
		this.lender.fragment = fragment;
		this.lender.owningInstance = this;

        this.parseParts();
        this.template = template; // Used for swapping later on.
        this.isBound = false;
        this.isConnected = false;
    }
	// MAYBE: Move this into parts somehow?
	*getComments(node) {
		const walker = document.createTreeWalker(node, NodeFilter.SHOW_COMMENT);
		while(walker.nextNode()) {
			yield walker.currentNode;
		}
	}
	parseParts() {
		for (const comment of Array.from(this.getComments(this.lender.fragment))) {
			for (const part of createParts(comment)) {
                this.parts.push(part);
            }
        }
    }

    configurePooling(pool) {
        if (pool) {
            this._pool = pool;
            this.autoPool = true;
        } else {
            this._pool = undefined;
            this.autoPool = false;
        }
    }
    mayPool() {
        if (this.isBound) {
            throw new Error("Shouldn't return to the pool unless the instance is unbound.");
        } else if (this.isConnected) {
            throw new Error("Shouldn't return to the pool unless the instance has disconnected (unbound) it's users.");
        } else if (this.autoPool) {
			this._pool.push(this);
			if (this.debugWrapper) this.debugWrapper.pooled();
        }
    }

    bindUsers() {
        for (let i = 0; i < this.parts.length; ++i) {
            const user = this.users[i];
            const part = this.parts[i];
            verifyUser(user, part);
            user.bind(part);
        }
    }
    unbindUsers() {
        this.users.forEach((oldUser, i) => {
            oldUser.unbind(this.parts[i]);
        });
		this.users.length = 0;
    }
    // I want bind and then connect to be the same as connect and then bind.
    connect(expressions) {
        // this.isBound is whether or not the instance has been bound to another part.  We only want to bind our users if we ourselves have already been bound.  If we haven't been then we should wait until we are bound to bind our users.  This solves the problem of swapping because an instance that is swapped-in won't have been bound yet.
        if (this.isConnected && this.isBound) {
            this.unbindUsers();
        }
        this.users = expressions.map(expression2user);
        if (this.users.length !== this.parts.length) {
            throw new Error("Different number of users then this instance has parts.");
        }
        // Make sure that all the users are appropriate for the parts
        this.users.forEach((user, i) => verifyUser(user, this.parts[i]));

        this.isConnected = true;

        if (this.isBound) {
            this.bindUsers();
        }
    }

    // Implement the User Interface
    get [User] () { return this; }
    get acceptTypes() { return  new Set(['node']); }
    bind(part) {
		this.isBound = true;
		// I had to move update before the user binding because css users need to get their root node which before we update our part is a document fragment... which doesn't have an adoptedStylesheets property.  I could do some funkery with doInFrameOnce but I don't like that so I'm just going to switch it here.
        part.update(this);

        if (this.isConnected) this.bindUsers();
    }
    unbind(part) {
        this.isBound = false;
        if (this.isConnected) {
            this.unbindUsers();
            this.isConnected = false;
        }

        part.clear();

        this.mayPool();
    }
	static swapInstances(existingInstance, replacingInstance) {
		// Swapping means giving the new instance your parts and unbinding your users from them so that the new person can bind their users to it.  We then pool ourselves because we are no longer in use.  The new instance controls the old dom that we controlled and we control the dom that they controlled.  We want them to take control because they are the one who has been connected with the value that the programmer wants to be displayed. All future control to that dom is going to go through that new instance.  This also means switching the fragment lenders because your fragment is now their fragment and vice versa.

		// Increment the swapping meta counter:
		++Meta.swapCount;

		if (!existingInstance.isBound) {
            throw new Error("Existing instance must be bound in order to swap.");
        }
		if (replacingInstance.isBound) {
            throw new Error("Replacing instance cannot be bound in order to swap.");
        }
		// Unbind users from the existing instance
		if (existingInstance.isConnected) {
            existingInstance.unbindUsers();
			existingInstance.isConnected = false;
		}

		// Sanity checks:
		if (replacingInstance.parts == existingInstance.parts) {
			throw new Error("Two instances should never have the same parts array.  This would likely indicate a bad past swap.");
		} else if (replacingInstance.parts.length !== existingInstance.parts.length) {
			throw new Error("Swapping instances must have the same number of parts.  Having a different number of parts could mean that the instances don't actually share a template or perhaps the template instantiation failed.");
		}

		// Switch the parts between the instances
		const tempParts = existingInstance.parts;
		existingInstance.parts = replacingInstance.parts;
		existingInstance.isBound = false;
		replacingInstance.parts = tempParts;
		replacingInstance.isBound = true;

		// Switch fragment lenders
		const tempLender = existingInstance.lender;
		existingInstance.lender = replacingInstance.lender;
		existingInstance.lender.owningInstance = existingInstance;
		replacingInstance.lender = tempLender;
		replacingInstance.lender.owningInstance = replacingInstance;

		// Switch the debugWrappers:
		const tempWrapper = existingInstance.debugWrapper;
		existingInstance.debugWrapper = replacingInstance.debugWrapper;
		replacingInstance.debugWrapper = tempWrapper;
		if (replacingInstance.debugWrapper) replacingInstance.debugWrapper.swapped();

		// If the existing instance had pooling enabled then it may be pooled now
		existingInstance.mayPool();

		// If the replacingInstance has already been connected then we should bind it's users
		if (replacingInstance.isConnected) replacingInstance.bindUsers();
	}

    // Implement the Swappable interface to catch swapping an instance with an instance derived from the same template
    get [Swappable]() { return this; }
    canSwap(newUser) {
		return newUser instanceof TemplateInstance && newUser.template == this.template;
	}
	doSwap(newInstance) {
		// Perform the swap:
		TemplateInstance.swapInstances(this, newInstance);
		return newInstance;
	}

    // Implement the Returnable Interface
    get [Returnable]() { return this.lender; }
}

// I just watched a video about the Chrome garbage collector which said that short lived objects are actually cheaper than long lived objects.  Pooling the instances was all about reusing objects and making them last longer.  Is that actually a good thing? (https://v8.dev/blog/trash-talk) TODO: Perf testing!
const InstancePools = new Map();
Meta.pools = InstancePools;

export function getTemplateInstance(template) {
    if (!InstancePools.has(template)) {
        InstancePools.set(template, []);
    }
    const pool = InstancePools.get(template);
    if (pool.length > 0) {
		const inst = pool.shift();
		if (inst.isConnected || inst.isBound) {
			throw new Error("Instance that was in the pool was either bound or connected.");
		}
        return inst;
    } else {
        const inst = new TemplateInstance(template);
        inst.configurePooling(pool);
        return inst;
    }
}

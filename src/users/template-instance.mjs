import {Returnable} from '../parts/node-part.mjs';
import createParts from '../parts/create-parts.mjs';
import User from './user.mjs';
import {expression2user, verifyUser} from './common.mjs';
import Swappable from './swappable.mjs';

export default class TemplateInstance {
    constructor(template) {
        this.users = [];
        this.parts = [];
        
        this.autoPool = false;
        this._fragment = document.importNode(template.content, true);
        this.parseParts();
        this.template = template; // Used for swapping later on.
        this.isBound = false;
        this.isConnected = false;
    }
	get isConnected() {
		return this._isConnected;
	}
	set isConnected(newValue) {
		console.log('setting isConnected');
		this._isConnected = newValue;
		return true;
	}
	// MAYBE: Move this into parts somehow?
	*getComments(node) {
		const walker = document.createTreeWalker(node, NodeFilter.SHOW_COMMENT);
		while(walker.nextNode()) {
			yield walker.currentNode;
		}
	}
	parseParts() {
		for (const comment of Array.from(this.getComments(this._fragment))) {
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

    swap_out(theirParts) {
        if (!this.isBound) {
            throw new Error("Shouldn't be swapping out if we're not bound.");
        } else {
            // Swapping means giving the new instance your parts and unbinding your users from them so that the new person can bind their users to it.  We then pool ourselves because we are no longer in use.  The new instance controls the old dom that we controlled and we control the dom that they controlled.  We want them to take control because they are the one who has been connected with the value that the programmer wants to be displayed. All future control to that dom is going to go through that new instance.
            const oldParts = this.parts;
            if (this.isConnected) {
                this.unbindUsers();
				this.isConnected = false;
			}
			
			this.parts = theirParts;
			
            this.isBound = false;
            
            this.mayPool();

            return oldParts;
        }
    }
    swap_in(newParts) {
        if (this.isBound) {
            throw new Error("Shouldn't be swapping in if we're already bound.");
        }
        this.parts = newParts;
        this.isBound = true;
        
        if (this.isConnected) this.bindUsers();
    }

    // Implement the Swappable interface to catch swapping an instance with an instance derived from the same template
    get [Swappable]() { return true; }
    canSwap(newUser) {
		return newUser instanceof TemplateInstance && newUser.template == this.template;
	}
	doSwap(newUser) {
		// Perform the swap:
		newUser.swap_in(this.swap_out(newUser.parts));
		console.log('Performed a swap.');
		return newUser;
	}
    
    // Implement the Returnable Interface
    get [Returnable]() { return this; }
    getFragment() {
        if (!this.isBound) {
            throw new Error("Should be bound before we are asked for our fragment.");
        }
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
        // TODO: This is where returning the instance to the pool used to happen, see if it works by relying on unbind.
        // this.mayPool
    }
}

// I just watched a video about the Chrome garbage collector which said that short lived objects are actually cheaper than long lived objects.  Pooling the instances was all about reusing objects and making them last longer.  Is that actually a good thing? (https://v8.dev/blog/trash-talk) TODO: Perf testing!
export const InstancePools = new WeakMap();

export function getTemplateInstance(template) {
    if (!InstancePools.has(template)) {
        InstancePools.set(template, []);
    }
    const pool = InstancePools.get(template);
    if (pool.length > 0) {
        return pool.pop();
    } else {
        const inst = new TemplateInstance(template);
        inst.configurePooling(pool);
        return inst;
    }
}

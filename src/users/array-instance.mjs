// @flow

import User from './user.mjs';
import NodePart, {Returnable} from '../parts/node-part.mjs';
import ObservableArray from '../lib/observable-array.mjs';
import doInFrameOnce from '../lib/do-in-frame-once.mjs';

export default class ArrayInstance {
    constructor(expressions = []) {
        this.users = [];
		this.parts = [];
        this._fragment = new DocumentFragment();
        for (const expr of expressions) {
            const text = new Text();
            this._fragment.appendChild(text);
            const part = new NodePart(text);
            this.parts.push(part);
            if (expr instanceof User) {
                User.get(expr).bind(part);
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

    // Implement the User Interface
    get [User] () { return this; }
    get acceptTypes() { return  new Set(['node']); }
    bind(part) {
        part.update(this);
    }
    unbind() {}
}
import User from './user.mjs';
import NodePart, {Returnable} from '../parts/node-part.mjs';
import { expression2user, verifyUser } from './common.mjs';
import range from '../lib/range.mjs';


export default class NodeArray {
	// The goal here is to optimize some of the common array functions.  When we're using our proxy bellow we might not know what's going on as well and might have to redo work.
	push(...newItems) {
		// ASSUME: None of the newItems can already be in the list.
		for (let i = 0; i < newItems.length; ++i) {
			const expr = newItems[i];
			const user = expression2user(expr);
			let part;
			const length = this.expressions.length + i;
			if (length == this.parts.length) {
				const temp = new Text();
				this.last.parentNode.insertBefore(temp, this.last);
				part = new NodePart(temp);
				this.parts.push(part);
			} else {
				part = this.parts[length]
			}
			verifyUser(user, part);
			this.users.push(user);
			user.bind(part);
		}
		return this.expressions.push(...newItems);
	}
	pop() {
		
	}
	splice(start, deleteCount, ...newItems) {
		
	}
	shift() {
		
	}
	unshift(...newItems) {
		// TODO: implement
	}
	constructor(expressions) {
		this.expressions = Array.from(expressions);
		this.users = this.expressions.map(expression2user);
		this.parts = [];
		this._fragment = new DocumentFragment();
		for (const user of this.users) {
			const text = new Text();
			this._fragment.appendChild(text);
			const part = new NodePart(text);
			this.parts.push(part);
			verifyUser(user, part);
			user.bind(part);
		}
		this.last = new Text();
		this._fragment.appendChild(this.last);

		const insertNodeAt = (index, node = new Text()) => {
			// Find the next part and insert before it
			for (const i of range(index + 1, this.parts.length, 1)) {
				const refPart = this.parts[i];
				if (refPart) {
					refPart.insertBefore(node);
					return node;
				}
			}
			// I'm pretty sure I never need to worry about using insert before because I have this.last now
			// No next parts so just insert it last
			this.last.parentNode.insertBefore(node, this.last);
			return node;
		}
		this.array = new Proxy(this.expressions, {
			get: (_, key) => {
				if (this.expressions.hasOwnProperty(key)) { // Numeric indexes and length hopefully.
					return this.expressions[key];
				} else if (key in this && this[key] instanceof Function) {
					return this[key].bind(this);
				} else if (this.expressions[key] instanceof Function) {
					return this.expressions[key].bind(this.array);
				} else {
					throw new Error('Error getting key: ', key);
				}
			},
			set: (_, key, newValue) => {
				// My old method was to unbind the user and rebind it elsewhere but this doesn't hold true to the lifecycle that the template instance expects.  It therefore unbind's it's users and then clears it's expression array. What this means is that I have to move the parts around.  Or, I could add a move method to users so that they can be moved between parts without an unbind then bind.
				const num = Number.parseInt(key);
				if (!isNaN(num) && num >= 0) {
					// I'm not really sure whether or not I could just use num everywhere instead of using key.
					const existingUser = this.users[key];
					let existingPart = this.parts[key];
					
					if (existingUser) {
						existingUser.unbind(existingPart);
					}
					
					if (newValue !== undefined) {
						const newUser = expression2user(newValue);
						// So, it can happen that we get the same user set in two spots and if we try to bind before we've unbound from the previous is a bit sad.  Honestly, I'm not sure if it would be better to move the part around or to do the unbind from the former part and a bind to the new part.  I'm going to implement it as unbind and rebind but it means that everything becomes algorithmically waaayyy more complex.  *Cringe*
						// MAYBE: add a boundPart property for users and have verifyUser unbind the old part.  That way you can move a user around without having to unbind it.  This would also mean checking if the user is bound to the part you were intending to unbind it from.)
						// TODO: See if we can't make it constant instead of linear for any change.
						const oldIndex = this.users.indexOf(newUser);
						if (oldIndex != -1) {
							const actualPart = this.parts[oldIndex];
							this.parts[oldIndex] = false;
							this.parts[key] = actualPart;
							
							let clear = true;
							for (const i of range(oldIndex, num)) {
								if (this.parts[i]) {
									clear = false;
									break;
								}
							}
							if (!clear) {
								const frag = actualPart.packageForMove();
								insertNodeAt(num, frag);
							}

							this.users[key] = this.users[oldIndex];
							this.users[oldIndex] = false;
						} else {
							if (!existingPart) {
								existingPart = this.parts[key] = new NodePart(insertNodeAt(num));
							}
							verifyUser(newUser, existingPart);
							newUser.bind(existingPart);
						}
						this.users[key] = newUser;
					} else {
						// TODO: Cleanup parts? or maybe bellow
						this.users[key] = undefined;
					}
					
				} else if (key == 'length') {
					// Clear the expressions past the new length (or prefill the new length if the length is greater than the old I suppose)
					for (const i of range(this.expressions.length, newValue)) {
						this.array[i - 1] = undefined;
					}
					this.users.length = newValue;
					// TODO: Cleanup parts? or maybe above
				} else {
					throw new Error('Error setting key: ', key, ' with value ', newValue);
				}
				this.expressions[key] = newValue;
				return true;
			}
		});
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
		this._fragment = frag;
	}

	// Implement the User Interface
	get [User] () { return this; }
	get acceptTypes() { return  new Set(['node']); }
	bind(part) {
		part.update(this);
	}
	unbind(part) { part.clear(); }
}
import User from './user.mjs';
import NodePart, {Returnable} from '../parts/node-part.mjs';
import { expression2user, verifyUser } from './common.mjs';
import range from '../lib/range.mjs';


export default class NodeArray {
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

		const arrFuncs = {
			/*
			push() {
				// TODO: implement
			},
			pop() {
				// TODO: implement
			},
			splice() {
				// TODO: implement
			},
			shift() {
				// TODO: implement
			},
			unshift() {
				// TODO: implement
			}
			*/
		};
		const insertPartAt = (parts, index) => {
			const temp = new Text();
			// Find the next part and insert before it
			for (const i of range(index + 1, parts.length, 1)) {
				const refPart = parts[i];
				if (refPart) {
					refPart.insertBefore(temp);
					const newPart = new NodePart(temp);
					this.parts[index] = newPart;
					return newPart;
				}
			}
			// I'm pretty sure I never need to worry about using insert before because I have this.last now
			// No next parts so just insert it last
			this.last.parentNode.insertBefore(temp, this.last);
			const newPart = new NodePart(temp);
			this.parts.push(newPart);
			return newPart;
		}
		this.array = new Proxy(this.expressions, {
			get: (_, key) => {
				console.log('Getting key: ', key);
				if (this.expressions.hasOwnProperty(key)) { // Numeric indexes and length hopefully.
					return this.expressions[key];
				} else if (key in arrFuncs) {
					return arrFunc[key];
				} else if (this.expressions[key] instanceof Function) {
					return this.expressions[key].bind(this.array);
				} else {
					throw new Error('Error getting key: ', key);
				}
			},
			set: (_, key, newExpression) => {
				console.group('Setting ', key, ' to ', newExpression);
				const num = Number.parseInt(key);
				if (!isNaN(num) && num >= 0) {
					// const oldExpression = this.expressions[key];
					const oldUser = this.users[key];
					const part = this.parts[key] || insertPartAt(this.parts, num);
					if (oldUser) {
						oldUser.unbind(part);
					}
					
					if (newExpression !== undefined) {
						const newUser = expression2user(newExpression);
						verifyUser(newUser, part);
						// So, it can happen that we get the same user set in two spots and if we try to bind before we've unbound from the previous is a bit sad.  Honestly, I'm not sure if it would be better to move the part around or to do the unbind from the former part and a bind to the new part.  I'm going to implement it as unbind and rebind but it means that everything becomes algorithmically waaayyy more complex.  *Cringe*
						// MAYBE: add a boundPart property for users and have verifyUser unbind the old part.  That way you can move a user around without having to unbind it.  This would also mean checking if the user is bound to the part you were intending to unbind it from.)
						const oldIndex = this.users.indexOf(newUser);
						if (oldIndex != -1) {
							// Unbind the user from any previous locations:
							console.log("Unbinding the user from it's old location of: ", oldIndex);
							this.users[oldIndex].unbind(this.parts[oldIndex]);
							this.users[oldIndex] = false;
						}
						this.users[key] = newUser;
						this.expressions[key] = newExpression;
						newUser.bind(part);
					} else {
						this.users[key] = undefined;
						this.expressions[key] = undefined;
					}
					
				} else if (key == 'length') {
					// Clear the expressions past the new length (or prefill the new length if the length is greater than the old I suppose)
					for (const i of range(this.expressions.length, newExpression)) {
						this.array[i - 1] = undefined;
					}
					this.users.length = newExpression;
					this.expressions.length = newExpression;
				} else {
					throw new Error('Error setting key: ', key, ' with value ', newExpression);
				}
				console.log('parts', this.parts);
				console.log('users', this.users);
				console.log('expressions', this.expressions);
				const multipleMap = new Map();
				this.expressions.forEach((expression, i) => {
					const arr = multipleMap.get(expression);
					if (arr) {
						arr.push(i);
					} else {
						multipleMap.set(expression, [i]);
					}
				});
				console.log(multipleMap);
				console.groupEnd();
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
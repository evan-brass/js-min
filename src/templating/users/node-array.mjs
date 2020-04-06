import User from './user.mjs';
import NodePart, {Returnable} from '../parts/node-part.mjs';
import { verifyUser, exchange_users } from './common.mjs';
import default_expression_to_user from '../expression-to-user.mjs';

// TODO: Add optimized array implementations - Use hints and tricks

export default class NodeArray {
	constructor(expressions = [], expression_to_user = default_expression_to_user) {
		// We have three arrays that together simulate the one array that is passed in... kinda yuck.
		// TODO: Implement a diffing approach that doesn't have as much memory overhead.
		this.e2u = expression_to_user;
		this.expressions = expressions;
		this.users = this.expressions.map(this.e2u);
		this.parts = [];
		this._fragment = new DocumentFragment();
		for (const user of this.users) {
			const text = new Text();
			this._fragment.appendChild(text);
			const part = new NodePart(text);
			this.parts.push(part);
			verifyUser(user, part);
			exchange_users(undefined, user, part);
		}
		this._tail = new Text();
		this._fragment.appendChild(this._tail);

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
				const index = Number.parseInt(key);
				if (key == 'length') {
					const new_length = Number.parseInt(newValue);
					const old_length = this.expressions.length;

					// Handle new_length < old_length;
					if (new_length < old_length) {
						for (let i = new_length; i < old_length; ++i) {
							const old_part = this.parts[i];
							const old_user = this.users[i];
							if (old_part && old_user) {
								old_user.unbind(old_part);
								old_part.remove();
								delete this.expressions[i];
								delete this.parts[i];
								delete this.users[i];
							} else {
								// We might have already deleted the items;
							}

						}
						// Set lengths on each sub array?
						this.expressions.length = new_length;
						this.parts.length = new_length;
						this.users.length = new_length;
					} else if (new_length > old_length) {
						console.log("Expanding the length of the array isn't implemented yet.");
					} else {
						// Do nothing if the length is already correct.
					}
				} else if (!isNaN(index) && index >=0) {
					this.set(index, newValue);
				} else {
					throw new Error('Unable to respond to setting the key: ', key);
				}
				return true;
			}
		});
	}
	get length() {
		return this.array.length;
	}
	set length(newLength) {
		return this.array.length = newLength;
	}
	// Customize the normal array functions to provide proper hinting:
	// TODO: push, splice, unshift, shift, pop, etc.
	// push(...items) {
	// 	for (let i = 0; i < items.length; ++i) {
	// 		const item = items[i];
	// 		this.set(this.length, item, {
	// 			old_index: -1,
	// 			old_value: false,
	// 			get values_between() { throw new Error("values_between shouldn't be needed"); },
	// 			relative_index: this.length + i - 1
	// 		});
	// 	}
	// 	this.length += items.length;
	// }

	set(index, value, hints_in = {}) {
		// I think that if all neccessary hints are supplied then we can do the set in constant time.  Otherwise, it's some janky linear I think.
		const self = this;
		const hints = {
			get old_index() {
				if (hints_in.old_index === undefined) {
					if (typeof value === 'object') {
						// O(n)
						return self.expressions.indexOf(value);
					} else {
						return -1;
					}
				} else {
					return hints_in.old_index;
				}
			},
			get old_value() {
				if (hints_in.old_value === undefined) {
					// Convert to boolean.
					return self.users[index] !== undefined;
				} else {
					return hints_in.old_value;
				}
			},
			get values_between() {
				if (hints_in.values_between === undefined) {
					// O(n)
					const low = Math.min(index, old_index) + 1;
					const high = Math.max(index, old_index) - 1;
					for (let i = low; i <= high; ++i) {
						if (self.parts[i]) {
							return true;
						}
					}
					return false;
				} else {
					return hints_in.values_between;
				}
			},
			get relative_index() {
				if (hints_in.relative_index === undefined) {
					// Find the closest index with a filled part that we can insert relative too: negative meens insert before, positive means insert after.  What about zero? Well, we can't put an item before the zeroth index so zero indicates insert after.  What if the array is empty and there's no parts to insert relative too?  Then we return false and we'll place it relative to a special element that is always at the end of the array.
					let before = index;
					let after = index;
					// O(n)
					while (--before >= 0 || ++after < self.parts.length) {
						if (self.parts[before]) {
							return before;
						}
						if (self.parts[after]) {
							return -after;
						}
					}
					return false;
				} else {
					return hints_in.relative_index;
				}
			}
		};

		// If there's a user / part already at the location, then remove them (But leave the part for now so that we have the ability to change things relative to it):
		const old_value = hints.old_value;
		const oldPart = this.parts[index];
		if (old_value) {
			const oldUser = this.users[index];
			oldUser.unbind(oldPart);
		}

		// This node (or document fragment) will be placed relative to the index
		let dom_to_relative;
		
		const old_index = hints.old_index;
		if (old_index !== -1) {
			// Item is already in the array at oldIndex: remove it
			const existing_part = this.parts[old_index];
			const existing_user = this.users[old_index];
			// existing_expression is (should be) the same as value
			delete this.parts[old_index];
			delete this.users[old_index];
			delete this.expressions[old_index];
			
			// Update the arrays:
			this.parts[index] = existing_part;
			this.users[index] = existing_user;
			
			// Move the value from it's old position to the new if there are values between, do nothing otherwise:
			const values_between = hints.values_between;
			if (values_between) {
				dom_to_relative = existing_part.packageForMove();
			}
		} else {
			// If the item is new to the array then we need to place a text item and then build a part after it's been placed in the dom:
			dom_to_relative = new Text();
		}

		if (dom_to_relative) {
			// Handle placing the dom relative to the index or relative to the existing part, depending.
			if (old_value) {
				// If there is a value already at the index that the value is moving to then we can place it relative to the part that is already there, taking over its location:
				oldPart.insertBefore(dom_to_relative);
			} else {
				const relative_index = hints.relative_index;
				const relative_part = this.parts[Math.abs(relative_index)];
				if (relative_index === false) {
					// Place relative to tail
					this._tail.parentNode.insertBefore(dom_to_relative, this._tail);
				} else if (relative_index < 0) {
					// Place before part at relative_index
					relative_part.insertBefore(dom_to_relative);
				} else {
					// Place after part at relative_index
					relative_part.insertAfter(dom_to_relative);
				}
			}
		}
		
		// Handle binding new users:
		if (old_index == -1) {
			// now that the text item is in the dom, we can build the new part and add bind the user to it:
			const part = new NodePart(dom_to_relative);
			const user = this.e2u(value);
			this.parts[index] = part;
			this.users[index] = user;
			user.bind(part);
		}
		
		// Update the expressions array:
		this.expressions[index] = value;
		
		// If there was an old part then we can remove it now that it has been used to relatively place the existing part:
		if (old_value) {
			oldPart.remove();
		}
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
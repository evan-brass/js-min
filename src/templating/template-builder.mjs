import User from 'users/user.mjs';
import {Returnable} from 'parts/node-part.mjs';
import Swappable from 'users/swappable.mjs';
import createParts from 'parts/create-parts.mjs';
import {verifyUser} from 'users/common.mjs';
import def_e2u from 'users/def-expr2user.mjs';

// Using the template builder is initialization
export default class TemplateBuilder {
	constructor() {
		// TODO: Maybe the default should be to enable pooling and swapping because I think they are pretty good for performance / efficiency.  But I don't want you to pay for things you don't need, so the defaults are off.
		this.pool_size = 0;
		this.swapping = false;

		this.debug_overlay = false;

		this.template = false;
		this.generate = false;
		this.expr2user = def_e2u;
	}
	with_pooling(pool_size = 3) {
		this.pool_size = pool_size;
		return this;
	}
	with_swapping(use_swapping = true) {
		this.swapping = use_swapping;
		return this;
	}
	with_expr2user(expr2user) {
		this.expr2user = expr2user;
		return this;
	}
	with_template(template) {
		if (this.generate) {
			throw new Error("Template can't have a template because it already has a generate function.");
		}
		this.template = template;
		return this;
	}
	build() {
		// TODO: handle pooling without swapping and viceversa

		// Save the state of the builder at the point that build was called so that we can use it later throughout the template.  Ideally, I would use the preprocessor to slightly modify the template code based on the configuration.  No compiler and preprocessor for js so this will have some runtime costs.  If there were a JS compiler (something like prepack) then hopefully the entire template builder would be eliminated altogether and the templates that it builds would have the dead code eliminated.
		const config = Object.freeze(Object.assign({}, this));
		
		// Used by templates that can swap
		const lenderBase = {
			getFragment() {
				const frag = this.fragment;
				if (frag) {
					this.fragment = false;
					return frag;
				} else {
					throw new Error("Fragment must be returned (aka. set) before it can be retreived.");
				}
			},
			returnFragment(frag) {
				// This is called when whoever had the instance is done with it.  We can clean it up and...
				this.fragment = frag;
			}
		};

		// Build the template
		const ret = class Template {
			static get_instance() {
				if (config.pool_size && this.pool.length) {
					return this.pool.pop();
				} else {
					return new Template();
				}
			}
			constructor() {
				// TODO: Handle debug_overlay

				this.users = [];

				// Import the template element's contents
				const fragment = document.importNode(this.template.content, true);

				// Turn the comment nodes into parts:
				const parts = [];
				{	
					let comments = [];
					let walker = document.createTreeWalker(fragment, NodeFilter.SHOW_COMMENT);
					while (walker.nextNode()) comments.push(walker.currentNode);
					for (const comment of comments) {
						for (const part of createParts(comment)) {
							parts.push(part);
						}
					}
				}

				if (config.swapping && config.pool_size) {
					// We only need a lender if we are both pooling and swapping, otherwise we can just use the usual fragment layout
					this.lender = Object.create(lenderBase);
					this.lender.fragment = fragment
					this.lender.parts = parts;
				} else {
					this.parts = parts;
					this.fragment = fragment;
				}

				// Used to make sure that we only connect our users once we have both received them and we have also been bound to a part.
				this.isBound = false;
				this.isConnected = false;
			}
			// Implement the Swappable interface to catch swapping an instance with an instance derived from the same template
			static swapInstances(existingInstance, replacingInstance) {
				// Swapping means giving the new instance your parts and unbinding your users from them so that the new person can bind their users to it.  We then pool ourselves because we are no longer in use.  The new instance controls the old dom that we controlled and we control the dom that they controlled.  We want them to take control because they are the one who has been connected with the value that the programmer wants to be displayed. All future control to that dom is going to go through that new instance.  This also means switching the fragment lenders because your fragment is now their fragment and vice versa.
		
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

				const ex_parts = config.pool_size ? existingInstance.lender.parts : existingInstance.parts;
				const re_parts = config.pool_size ? replacingInstance.lender.parts : replacingInstance.parts;
		
				// Sanity checks:
				if (ex_parts == re_parts) {
					throw new Error("Two instances should never have the same parts array.  This would likely indicate a bad past swap.");
				} else if (ex_parts.length !== re_parts.length) {
					throw new Error("Swapping instances must have the same number of parts.  Having a different number of parts could mean that the instances don't actually share a template or perhaps the template instantiation failed.");
				}
		
				// Switch the parts between the instances
				if (!config.pool_size) {
					const temp = existingInstance.parts;
					existingInstance.parts = replacingInstance.parts;
					replacingInstance.parts = temp;
				}
				existingInstance.isBound = false;
				replacingInstance.isBound = true;
		
				// Switch fragment (or fragment lenders)
				if (config.pool_size) {
					const temp = existingInstance.lender;
					existingInstance.lender = replacingInstance.lender;
					replacingInstance.lender = temp;
				} else {
					const temp = existingInstance.fragment;
					existingInstance.fragment = replacingInstance.fragment;
					replacingInstance.fragment = temp;
				}
		
				// If the existing instance had pooling enabled then it may be pooled now
				if (config.pool_size) {
					existingInstance.mayPool();
				}
		
				// If the replacingInstance has already been connected then we should bind it's users
				if (replacingInstance.isConnected) replacingInstance.bindUsers();
			}
			canSwap(newUser) {
				return newUser instanceof ret;
			}
			doSwap(newInstance) {
				// Perform the swap:
				ret.swapInstances(this, newInstance);
				return newInstance;
			}
			mayPool() {
				if (this.isBound) {
					throw new Error("Shouldn't return to the pool unless the instance is unbound.");
				} else if (this.isConnected) {
					throw new Error("Shouldn't return to the pool unless the instance has disconnected (unbound) it's users.");
				} else {
					this.constructor.pool.push(this);
				}
			}
			bindUsers() {
				const parts = (config.swapping && config.pool_size) ? this.lender.parts : this.parts;

				for (let i = 0; i < parts.length; ++i) {
					const user = this.users[i];
					const part = parts[i];
					verifyUser(user, part);
					user.bind(part);
				}
			}
			unbindUsers() {
				const parts = (config.swapping && config.pool_size) ? this.lender.parts : this.parts;

				this.users.forEach((oldUser, i) => {
					oldUser.unbind(parts[i]);
				});
				this.users.length = 0;
			}
			connect(expressions) {
				const parts = (config.swapping && config.pool_size) ? this.lender.parts : this.parts;

				// this.isBound is whether or not the instance has been bound to another part.  We only want to bind our users if we ourselves have already been bound.  If we haven't been then we should wait until we are bound to bind our users.  This solves the problem of swapping because an instance that is swapped-in won't have been bound yet.
				if (this.isConnected && this.isBound) {
					this.unbindUsers();
				}
				this.users = expressions.map(this.expr2user);
				if (this.users.length !== parts.length) {
					throw new Error("Different number of users then this instance has parts.");
				}
				// Make sure that all the users are appropriate for the parts
				this.users.forEach((user, i) => verifyUser(user, parts[i]));
		
				this.isConnected = true;
		
				if (this.isBound) {
					this.bindUsers();
				}
			}
			bind(part) {
				this.isBound = true;
				// I had to move update before the user binding because css users need to get their root node which before we update our part is a document fragment... which doesn't have an adoptedStylesheets property.  I could do some funkery with doInFrameOnce but I don't like that so I'm just going to switch it here.
				if (config.pool_size) {
					// We only use implement the Returnable trait when we're pooling because that's the only time that we want our fragment back.
					part.update(this);
				} else {
					if (config.swapping && config.pool_size) {
						// In the case of swapping without pooling, the lender isn't so much of a lender I guess it really just stores the parts and fragment.  That could be handled be two cases which might be something to do in the future.
						part.update(this.lender.fragment);
					} else {
						part.update(this.fragment);
					}
				}
		
				if (this.isConnected) this.bindUsers();
			}
			unbind(part) {
				this.isBound = false;
				if (this.isConnected) {
					this.unbindUsers();
					this.isConnected = false;
				}
		
				part.clear();
	
				if (config.pool_size) {
					this.mayPool();
				}
			}
			getFragment() {
				if (!config.swapping && config.pool_size) {
					const frag = this.fragment;
					if (frag) {
						this.fragment = false;
						return frag;
					} else {
						throw new Error("Fragment must be returned (aka. set) before it can be retreived.");
					}
				} else {
					throw new Error("The fragment should only directly implement the Returnable trait if swapping is disabled but pooling isn't.");
				}
			}
			returnFragment(frag) {
				if (!config.swapping && config.pool_size) {
					// This is called when whoever had the instance is done with it.  We can clean it up and...
					this.fragment = frag;
				} else {
					throw new Error("The fragment should only directly implement the Returnable trait if swapping is disabled but pooling isn't.");
				}
			}
		};

		if (config.swapping) {
			// Only define the swapping symbol if swapping is enabled.
			Object.defineProperty(ret.prototype, Swappable, {
				get() { return this; }
			});
		} else {
			delete ret.prototype.canSwap;
			delete ret.prototype.doSwap;
			delete ret.swapInstances;
		}

		if (config.template) {
			ret.prototype.template = config.template;
		}

		if (config.pool_size) {
			// Only add a pool array if pooling is enabled.
			ret.pool = [];
			Object.defineProperty(ret.prototype, Returnable, {
				get() { return config.swapping ? this.lender : this; }
			});
		} else {
			delete ret.prototype.mayPool;
		}

		// Handle expr2user
		ret.prototype.expr2user = this.expr2user;

		// Add some properties common to all templates
		Object.defineProperty(ret.prototype, User, {
			get() { return this; }
		});
		ret.prototype.acceptTypes = new Set(['node']);

		return ret;
	}
}
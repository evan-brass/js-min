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
	with_debug_overlay(use_debug_overlay = true) {
		this.debug_overlay = use_debug_overlay;
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
	with_generate_function(generate) {
		if (this.template) {
			throw new Error("Template can't have a generate function because it already has a template.");
		}
		this.generate = generate;
		return this;
	}
	build() {
		// Save the state of the builder at the point that build was called so that we can use it later throughout the template.  Ideally, I would use the preprocessor to slightly modify the template code based on the configuration.  No compiler and preprocessor for js so this will have some runtime costs.  If there were a JS compiler (something like prepack) then hopefully the entire template builder would be eliminated altogether and the templates that it builds would have the dead code eliminated.
		const config = Object.freeze(Object.assign({}, this));

		// return class Template {
		// 	constructor() {

		// 	}
		// };

		let ret;
		// Handle the template or generate function
		if (this.template) {
			// Handle Swapping
			if (this.swapping) {
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
				ret = class Template {
					constructor() {
						this.lender = Object.create(lenderBase);
						this.lender.fragment = document.importNode(this.template.content, true);
						{	let comments = [];
							let walker = document.createTreeWalker(this.lender.fragment, NodeFilter.SHOW_COMMENT);
							while (walker.nextNode()) comments.push(walker.currentNode);
							this.lender.parts = [];
							for (const comment of comments) {
								for (const part of createParts(comment)) {
									this.lender.parts.push(part);
								}
							}
						}
						this.users = [];
					}
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
				
						// Sanity checks:
						if (replacingInstance.lender.parts == existingInstance.lender.parts) {
							throw new Error("Two instances should never have the same parts array.  This would likely indicate a bad past swap.");
						} else if (replacingInstance.lender.parts.length !== existingInstance.lender.parts.length) {
							throw new Error("Swapping instances must have the same number of parts.  Having a different number of parts could mean that the instances don't actually share a template or perhaps the template instantiation failed.");
						}
				
						// Switch the parts between the instances
						existingInstance.isBound = false;
						replacingInstance.isBound = true;
				
						// Switch fragment lenders
						const tempLender = existingInstance.lender;
						existingInstance.lender = replacingInstance.lender;
						existingInstance.lender.owningInstance = existingInstance;
						replacingInstance.lender = tempLender;
						replacingInstance.lender.owningInstance = replacingInstance;
				
						// If the existing instance had pooling enabled then it may be pooled now
						// TODO: Enable pooling
						// existingInstance.mayPool();
				
						// If the replacingInstance has already been connected then we should bind it's users
						if (replacingInstance.isConnected) replacingInstance.bindUsers();
					}
				
					// Implement the Swappable interface to catch swapping an instance with an instance derived from the same template
					get [Swappable]() { return this; }
					canSwap(newUser) {
						return newUser instanceof ret;
					}
					doSwap(newInstance) {
						// Perform the swap:
						ret.swapInstances(this, newInstance);
						return newInstance;
					}
					bindUsers() {
						for (let i = 0; i < this.lender.parts.length; ++i) {
							const user = this.users[i];
							const part = this.lender.parts[i];
							verifyUser(user, part);
							user.bind(part);
						}
					}
					unbindUsers() {
						this.users.forEach((oldUser, i) => {
							oldUser.unbind(this.lender.parts[i]);
						});
						this.users.length = 0;
					}
					get [Returnable]() { return this.lender; }
					connect(expressions) {
						// this.isBound is whether or not the instance has been bound to another part.  We only want to bind our users if we ourselves have already been bound.  If we haven't been then we should wait until we are bound to bind our users.  This solves the problem of swapping because an instance that is swapped-in won't have been bound yet.
						if (this.isConnected && this.isBound) {
							this.unbindUsers();
						}
						this.users = expressions.map(this.expr2user);
						if (this.users.length !== this.lender.parts.length) {
							throw new Error("Different number of users then this instance has parts.");
						}
						// Make sure that all the users are appropriate for the parts
						this.users.forEach((user, i) => verifyUser(user, this.lender.parts[i]));
				
						this.isConnected = true;
				
						if (this.isBound) {
							this.bindUsers();
						}
					}
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
			
						// TODO: Return to the pool.
					}
				};
			} else {
				ret = class Template {
					constructor() {
						this.users = [];
						this.parts = [];

						// Import the template
						this.fragment = document.importNode(this.template.content, true);

						// Turn the comment nodes into parts:
						{	let comments = [];
							let walker = document.createTreeWalker(this.fragment, NodeFilter.SHOW_COMMENT);
							while (walker.nextNode()) comments.push(walker.currentNode);
							for (const comment of comments) {
								for (const part of createParts(comment)) {
									this.parts.push(part);
								}
							}
						}

						// Used to make sure that we only connect our users once we have both received them and we have also been bound to a part.
						this.isBound = false;
						this.isConnected = false;
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
					bind(part) {
						this.isBound = true;
						// I had to move update before the user binding because css users need to get their root node which before we update our part is a document fragment... which doesn't have an adoptedStylesheets property.  I could do some funkery with doInFrameOnce but I don't like that so I'm just going to switch it here.
						part.update(this.fragment);
				
						if (this.isConnected) this.bindUsers();
					}
					unbind(part) {
						this.isBound = false;
						if (this.isConnected) {
							this.unbindUsers();
							this.isConnected = false;
						}
				
						part.clear();
			
						// TODO: Return to the pool.
					}
					connect(expressions) {
						// this.isBound is whether or not the instance has been bound to another part.  We only want to bind our users if we ourselves have already been bound.  If we haven't been then we should wait until we are bound to bind our users.  This solves the problem of swapping because an instance that is swapped-in won't have been bound yet.
						if (this.isConnected && this.isBound) {
							this.unbindUsers();
						}
						this.users = expressions.map(this.expr2user);
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
				}
			}
			ret.prototype.template = this.template;
		} else if (this.generate) {
			// TODO: Implement
			throw new Error("Generate functions aren't supported yet.");
		} else {
			throw new Error("Either a template or a generate function must be set to build a template.");
		}

		// Handle expr2user
		ret.prototype.expr2user = this.expr2user;

		// Handle Pooling
		if (this.pool_size) {
			ret.pool = [];
			ret.get_instance = function() {
				if (ret.pool.length) {
					return ret.pool.pop();
				} else {
					return new ret();
				}
			};
			// TODO: Handle returning to the pool
		} else {
			ret.get_instance = function() {
				return new ret();
			};
		}

		// Add some properties common to all templates
		Object.defineProperty(ret.prototype, User, {
			get() { return this; }
		});
		ret.prototype.acceptTypes = new Set(['node']);

		// Handle Debug Overlay
		if (this.debug_overlay) {
			throw new Error("The debug overlay is not currently implemented.");
		}
		return ret;
	}
}
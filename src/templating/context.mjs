import sha1 from 'lib/string-hash.mjs';
import convertMarkers from 'parts/convert-markers.mjs';
import NodePart from 'parts/node-part.mjs';
import { verifyUser } from 'users/common.mjs';

import def_e2u from 'users/def-expr2user.mjs';
import User from 'users/user.mjs';
import StylePart from 'parts/style-part.mjs';

import awaitReplace from 'users/await-replace.mjs';

// TODO: Probably should be a WeakMap
const id_cache = new Map();

// TODO: Could be a weakmap
const styleSheetCache = new Map(); 

// TODO: I don't like having to hold a reference to the context from within the template just so that I can call expression2user.  That's rediculous, and it would be rediculous to set_expression_handlers part way through running.  Instead, maybe I should just pass an expression2user function using builder.with_e2u or something.  I've been planning on giving the context to all those sub users as well which doesn't make sense.  Instead maybe I need a simple e2u thing that you can give to make and then give to those users and templates and whatnot.  I suppose that that was what the templating context was supposed to be to begin with so maybe I just don't have a clear view of what the templating context is.
// Ok, I think it makes sense to split that out because really the only functionality that you want on the e2u is e2u.  Also, you might use e2u even if you weren't using html or mount or html_id.  SImiliarly, you might want to use TemplateBuilder and Templates without the context (like with a generate function perhaps).


export default class TemplatingContext {
	constructor() {
		this.constructors = new Map();
		this.expr2user = def_e2u;
		this.default_instance_builder = false;
	}
	set_expr2user(expr2user) {
		this.expr2user = expr2user;
		return this;
	}
	set_default_instance_builder(builder) {
		this.default_instance_builder = builder;
		return this;
	}
	add_template(id, constructor) {
		this.constructors.set(id, constructor);
		return this;
	}
	// MAYBE: Have a remove template function?
	html_id(id, ...expressions) {
		const constructor = this.constructors.get(id);
		const inst = constructor.get_instance(); // By letting the constructor decide how to get an instance (could be from a pool, could be made from scratch, etc.) we don't need to have a bunch of options.
		inst.connect(expressions);
		return inst;
	}
	html(strings, ...expressions) {
		let id = id_cache.get(strings);
		if (!id) {
			return awaitReplace((async() => {
				const id = 'a' + await sha1(strings.join('{{}}'));
				id_cache.set(strings, id);

				if (!this.constructors.has(id)) {
					// Create a template
					let order = 0;
					let template_contents = strings[0];
					for (let i = 1; i < strings.length; ++i) {
						template_contents += `${id}-${order++}`;
						template_contents += strings[i];
					}
					const template = document.createElement('template');
					template.innerHTML = template_contents;
	
					convertMarkers(template, id);

					this.default_instance_builder.with_template(template);
					this.default_instance_builder.with_expr2user(this.expr2user);
	
					this.add_template(id, this.default_instance_builder.build());
				}

				return this.html_id(id, ...expressions);
			})());
		} else {
			return this.html_id(id, ...expressions);
		}
	}
	css(strings, ...expressions) {
		const e2u = this.expr2user;
		// Check for CSSStyleSheet constructor
		let supportsStyleSheets = true;
		try {
			const _ = new CSSStyleSheet();
		} catch(_) {
			supportsStyleSheets = false;
		}
		return {
			get [User]() { return this; },
			acceptTypes: new Set(['node']),
			bind(part) {
				this.root = part.element.getRootNode();
				this.parts = [];
				if (strings.length == 1 && supportsStyleSheets) {
					if (!styleSheetCache.has(strings)) {
						this.stylesheet = new CSSStyleSheet({});
						this.stylesheet.replace(Array.prototype.join.call(strings, ''));
						styleSheetCache.set(strings, this.stylesheet);
					} else {
						this.stylesheet = styleSheetCache.get(strings);
					}
				} else {
					if (supportsStyleSheets) {
						this.stylesheet = new CSSStyleSheet({});
					} else {
						this.stylesheet = document.createElement('style');
					}
					this.users = expressions.map(e2u);
					const shared = [];
					let strings_i;
					for (strings_i = 0; strings_i < (strings.length - 1); ++strings_i) {
						shared.push(strings[strings_i]);
						shared.push('');
						this.parts.push(new StylePart(part.element, this.stylesheet, shared, shared.length - 1));
					}
					shared.push(strings[strings_i]);
					if (this.parts.length !== this.users.length) {
						throw new Error("There aren't the proper number of expressions for this literal.");
					}
					if (supportsStyleSheets) {
						this.stylesheet.replace(shared.join(''));
					} else {
						this.stylesheet.innerText = shared.join('');
					}
					for (let i = 0; i < this.parts.length; ++i) {
						const part = this.parts[i];
						const user = this.users[i];
						verifyUser(user, part);
						user.bind(part);
					}
				}
				if (supportsStyleSheets) {
					this.root.adoptedStyleSheets = [this.stylesheet, ...this.root.adoptedStyleSheets];
				} else {
					part.update(this.stylesheet);
				}
			},
			unbind(part) {
				if (supportsStyleSheets) {
					const newStyleSheets = Array.from(this.root.adoptedStyleSheets);
					newStyleSheets.splice(newStyleSheets.indexOf(this.stylesheet), 1);
					this.root.adoptedStyleSheets = newStyleSheets;
				} else {
					part.clear();
				}
				for (let i = 0; i < this.parts.length; ++i) {
					const part = this.parts[i];
					const user = this.users[i];
					user.unbind(part);
				}
			},
			get disabled() {
				// TODO: Fix disabled for style tags
				return this.stylesheet && this.stylesheet.disabled;
			},
			set disabled(newValue) {
				if (this.stylesheet && this.stylesheet instanceof CSSStyleSheet) {
					this.stylesheet.disabled = newValue;
					return true;
				} else {
					return false;
				}
			}
		};
	}
	mount(expression, root = document.body) {
		const temp = new Text();
		root.appendChild(temp);
		const part = new NodePart(temp);
		const user = this.expr2user(expression);
		verifyUser(user, part);
		user.bind(part);
		return function unmount() {
			user.unbind(part);
		};
	}
}
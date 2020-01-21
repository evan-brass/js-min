// @flow

import User from './user.mjs';
import StylePart from '../parts/style-part.mjs';
import { expression2user, verifyUser } from './common.mjs';

const styleSheetCache = new Map(); // Could be a weakmap

export default function css(strings, ...expressions) {
	// Check for CSSStyleSheet constructor
	let supportsStyleSheets = true;
	try {
		const _ = new CSSStyleSheet();
	} catch(_) {
		supportsStyleSheets = false;
	}
	return {
		get [User]() {return this;},
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
				this.users = expressions.map(expression2user);
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
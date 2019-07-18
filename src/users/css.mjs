import User from './user.mjs';
import StylePart from '../parts/style-part.mjs';
import { expression2user, verifyUser } from './common.mjs';


export default function css(strings, ...expressions) {
	return {
		get [User]() {return this;},
		acceptTypes: ['node'],
		bind(part) {
			this.users = expressions.map(expression2user);
			this.root = part.element.getRootNode();
			this.stylesheet = new CSSStyleSheet({});
			const shared = [];
			this.parts = [];
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
			this.stylesheet.replace(shared.join(''));
			for (let i = 0; i < this.parts.length; ++i) {
				const part = this.parts[i];
				const user = this.users[i];
				verifyUser(user, part);
				user.bind(part);
			}
			const newStyleSheets = Array.from(this.root.adoptedStyleSheets);
			newStyleSheets.push(this.stylesheet);
			this.root.adoptedStyleSheets = newStyleSheets;
		},
		unbind(part) {
			const newStyleSheets = Array.from(this.root.adoptedStyleSheets);
			newStyleSheets.splice(newStyleSheets.indexOf(this.stylesheet), 1);
			this.root.adoptedStyleSheets = newStyleSheets;
			for (let i = 0; i < this.parts.length; ++i) {
				const part = this.parts[i];
				const user = this.users[i];
				user.unbind(part);
			}
		},
		get disabled() {
			return this.stylesheet && this.stylesheet.disabled;
		},
		set disabled(newValue) {
			if (this.stylesheet) {
				this.stylesheet.disabled = newValue;
				return true;
			} else {
				return false;
			}
		}
	};
}
import { expression2user, verifyUser } from './users/common.mjs';
import NodePart from './parts/node-part.mjs';

export default Base_extend();

// Static stylesheets shared between instances of a ce
const stylesheetMap = new WeakMap();

export function Base_extend(inherit = HTMLElement) {
	return class Base extends inherit {
		constructor() {
			super();

			// Construct the shadow DOM
			this.attachShadow({mode: 'open'});
		}
		get staticStyles() {
			return '';
		}
		async *dynamicStyles() {
			return;
		}
		async *run() {} // Empty state machine
		connectedCallback() {
			// Handle static styles
			if (!stylesheetMap.has(this.constructor)) {
				const stylesheet = new CSSStyleSheet({});
				stylesheet.replace(this.staticStyles);
				stylesheetMap.set(this.constructor, stylesheet);
			}
			const static_stylesheet = stylesheetMap.get(this.constructor);

			// Handle dynamic styles
			const dynamic_stylesheet = new CSSStyleSheet({});
			const style_stream = this.dynamicStyles();
			this._style_instance = (async function update_styles() {
				try {
					for await (const str of style_stream) {
						await dynamic_stylesheet.replace(str);
					}
				} finally {
					// this.shadowRoot.adoptedStyleSheets = [];
				}
			})();

			// Set them both on the shadowroot
			this.shadowRoot.adoptedStyleSheets = [static_stylesheet, dynamic_stylesheet];


			// Setup and run the state machine
			const stream = this.run();

			const temp = new Comment();
			this.shadowRoot.appendChild(temp);
			const part = new NodePart(temp);
			
			this._instance = (async function update() {
				let user;
				try {
					for await(const expr of stream) {
						if (user) user.unbind(part);
						user = expression2user(expr);
						verifyUser(user, part);
						user.bind(part);
					}
				} finally {
					if (user) user.unbind(part);
				}
			})();
		}
		disconnectedCallback() {
			this._instance.return();
			this._style_instance.return();
		}
	};
}
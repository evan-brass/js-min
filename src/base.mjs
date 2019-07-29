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
		// TODO: Switch to something completely cancellable like a pure generator or something.
		async *run() {} // Empty state machine
		connectedCallback() {
			// Setup and run the state machine

			const temp = new Comment();
			this.shadowRoot.appendChild(temp);
			const part = new NodePart(temp);
			
			this._instance = (async function* update() {
				let user;
				try {
					for await(const expr of this.run()) {
						if (user) user.unbind(part);
						user = expression2user(expr);
						verifyUser(user, part);
						user.bind(part);
					}
				} finally {
					if (user) user.unbind(part);
				}
			})();
			this._instance.next();
		}
		disconnectedCallback() {
			this._instance.return();
		}
	};
}
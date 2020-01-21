// @flow

import NodePart from './parts/node-part.mjs';
import {expression2user} from './users/common.mjs';
import { verifyUser } from './users/common.mjs';

// TODO: As with this whole thing: need clearer lifecycle guarantees.  Will the last user be unbound if disconnectCallback is called and the instance is .return()'d ?  I don't know.  That's one of the open questions I have about async generators.

export default function behavior(gen, inherit = HTMLElement) {
	return class Behavior extends inherit {
		constructor() {
			super();

			// Construct the shadow DOM
			this.attachShadow({mode: 'open'});
		}
        connectedCallback() {
			const temp = new Comment();
			this.shadowRoot.appendChild(temp);
			
			const part = new NodePart(temp);

			this._instance = gen.call(this);
			
            (async () => {
				let user;
				for await(const expr of this._instance) {
					if (user) user.unbind(part);
					user = expression2user(expr);
					verifyUser(user, part);
					user.bind(part);
				}
			})();
        }
        disconnectedCallback() {
            this._instance.return();
        }
	};
}
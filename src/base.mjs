import Future from './future.mjs';

export default Base_extend();

export function Base_extend(inherit = HTMLElement) {
	return class Base extends inherit {
		constructor() {
			super();

			// Construct the shadow DOM
			this.attachShadow({mode: 'open'});
		}
		*run() {} // Empty state machine
		connectedCallback() {
			// Setup and run the state machine
			this._future = new Future(this.run());
		}
		disconnectedCallback() {
			this._future.cancel();
		}
	};
}
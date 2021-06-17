// TODO: this._abortController should be private
export function base_extend(inherit = HTMLElement) {
	return class Base extends inherit {
		_abort_controller = new AbortController()
		constructor() {
			super();

			// Construct the shadow DOM
			this.attachShadow({ mode: 'open' });
		}
		async run(_signal) { } // Empty state machine
		connectedCallback() {
			// Setup and run the state machine
			this.run(this.signal);
		}
		get signal() {
			return this._abort_controller.signal;
		}
		disconnectedCallback() {
			this._abort_controller.abort();
		}
	};
}

export default base_extend();
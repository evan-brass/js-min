export function Base_extend(inherit = HTMLElement) {
	return class Base extends inherit {
		abortController = new AbortController()
		
		constructor() {
			super();
			
			// Construct the shadow DOM
			this.attachShadow({mode: 'open'});
		}
		*run() {} // Empty state machine
		connectedCallback() {
			// Setup and run the state machine
			this.run(this.abortController.signal);
		}
		disconnectedCallback() {
			this.abortController.abort();
		}
	};
}

export default Base_extend();
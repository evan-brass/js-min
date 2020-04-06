export function base_extend(inherit = HTMLElement) {
	return class Base extends inherit {		
		constructor() {
			super();

			this.abortController = new AbortController();
			
			// Construct the shadow DOM
			this.attachShadow({mode: 'open'});
		}
		async run(_signal) {} // Empty state machine
		connectedCallback() {
			// Setup and run the state machine
			this.run(this.abortController.signal);
		}
		disconnectedCallback() {
			this.abortController.abort();
		}
	};
}

export default base_extend();
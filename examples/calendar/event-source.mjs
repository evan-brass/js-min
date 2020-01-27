import Trait from 'lib/trait.mjs';

export default new Trait("EventSource", {
	async getEvents(_interval, _abortSignal) {
		throw new Error('No default implementation for getEvents.');
	}
});
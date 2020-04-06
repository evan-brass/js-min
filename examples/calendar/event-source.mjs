import Trait from '../../src/lib/trait.mjs';

export default new Trait('EventSource', {
	async getEvents(_interval, _abortSignal) { // Returns an aray of Events
		throw new Error('No default implementation for getEvents.');
	}
});
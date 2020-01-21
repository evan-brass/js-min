// @flow

import Trait from '../../lib/trait.mjs';

export default new Trait("EventSource", {
	async getEvents(_interval) {
		throw new Error('No default implementation for getEvents.');
	}
});
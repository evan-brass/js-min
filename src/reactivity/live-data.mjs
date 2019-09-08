import Reactor from './reactor.mjs';
import syncDepth from './sync-depth.mjs';

export default class LiveData {
	// TODO: switch to a differed.
	constructor() {
		this.waiters = [];
	}
	set value(newValue) {
		this._value = newValue;
		// console.log(`LiveData: Setting to new value: ${newValue}`);
		for (const callback of this.waiters) {
			callback(newValue);
		}
		this.waiters.length = 0;
	}
	get value() {
		return this._value;
	}
	then(callback) {
		this.waiters.push(callback);
	}
	async *[Symbol.asyncIterator]() {
		if (this._value === undefined) await this;
		let listenerDepth = false;
		while (true) {
			if (listenerDepth) await syncDepth(listenerDepth, this.depth);
			const lastIssued = this._value;
			listenerDepth = yield lastIssued;
			if (this._value === lastIssued) {
				// If we're caught up then wait for an update
				await this;
			}
		}
	}

	// Implement the reactor interface:
	get [Reactor]() { return this; }
	get depth() {
		// Live Data objects have no dependencies so their depth is always 0
		return 0;
	}
}
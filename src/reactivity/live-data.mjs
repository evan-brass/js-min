import Reactor from './reactor.mjs';
import syncDepth from './sync-depth.mjs';
import {Reactive, addDependents} from './reactive.mjs';

export default class LiveData extends Reactive.implementation {

	set value(newValue) {
		this._value = newValue;
		this.propagate();
	}
	// Implement the Reactive Trait:
	get depth() {
		// Live Data objects have no dependencies so their depth is always 0
		return 0;
	}
	get value() {
		return this._value;
	}

	// <BEGIN OLD>
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
}
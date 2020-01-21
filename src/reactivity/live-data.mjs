// @flow

import { Reactive } from './reactive.mjs';

export default class LiveData extends Reactive.implementation {
	constructor(initialValue) {
		super();
		this._value = initialValue;
	}

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

	[Symbol.asyncIterator]() {
		const CaughtUp = Symbol('This symbol indicates that the async iterator is caught up with the live data object');
		let toIssue = this.value;
		let resolve = [];
		const self = this;
		const ReactiveUser = {
			get depth() {
				return self.depth + 1;
			},
			update() {
				if (resolve.length) {
					resolve.shift()({value: self.value, done: false});
				} else {
					toIssue = self.value;
				}
			},
			get [Reactive]() { return this; }
		};
		this.depend(ReactiveUser);
		return {
			next() {
				if (toIssue !== CaughtUp) {
					const temp = toIssue;
					toIssue = CaughtUp;
					return Promise.resolve({value: temp, done: false});
				} else {
					return new Promise(res => resolve.push(res));
				}
			},
			return() {
				self.undepend(ReactiveUser);
				return Promise.resolve({done: true});
			},
			[Symbol.asyncIterator]() {
				return this;
			}
		};
	}
}
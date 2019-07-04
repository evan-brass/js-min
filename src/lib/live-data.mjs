
export default class LiveData {
	constructor() {
		this.waiters = [];
	}
	set value(newValue) {
		this._value = newValue;
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
		while (true) {
			const lastIssued = this._value;
			yield lastIssued;
			if (this._value == lastIssued) {
				// If we're caught up then wait for an update
				await this;
			}
		}
	}
}
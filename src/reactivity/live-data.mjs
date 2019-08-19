export default class LiveData {
	// TODO: switch to a differed.
	constructor() {
		this.waiters = [];
	}
	set value(newValue) {
		this._value = newValue;
		console.log(`LiveData: Setting to new value: ${newValue}`);
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
		while (true) {
			const lastIssued = this._value;
			yield lastIssued;
			if (this._value === lastIssued) {
				// If we're caught up then wait for an update
				await this;
			}
		}
	}
}
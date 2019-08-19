import NEVER from '../lib/never.mjs';
import range from '../lib/range.mjs';

export default class ComputedValue {
	constructor(evaluate, ...sources) {
		this.evaluate = evaluate;
		// Make sure we have async iterables:
		this.sources = sources.flat().map(obj => obj.next ? obj : obj[Symbol.asyncIterator]());
		// Everything starts invalid:
		this.invalid = [...range(0, this.sources.length)];
		// No initial values:
		this.values = [];
		// No values until first revalidation:
		this.promises = [];
		this.inst = false;
	}
	then(...args) {
		if (!this.inst) this.inst = this.getNextValue();
		this.inst.then(...args);
	}
	async getNextValue() {
		// MAYBE: I'm concerned about double updates.  If one computed is dependent on another computed and they are both dependent on a value, would the first one be updated twice?  I'm not sure how the microtasks would work out there, especially since there's no dependency DAG height information...
		// This updates the value with a result from an async iterator
		const changeHandler = async i => {
			const source = this.sources[i];
			const {value, done} = await source.next();
			// Note the value:
			this.values[i] = value;
			if (!done) {
				// If we're not done then we need to revalidate next time someone wants a value.
				this.invalid.push(i);
				this.promises[i] = "Invalid";
			} else {
				// If we're done then the value will never change again. It's not a problem if all the promises are NEVER, that just means that we won't update any of our existing 
				this.promises[i] = NEVER;
			}
		};
		// If anything is invalid then revalidate it.
		if (this.invalid.length) {
			for (const invalidIndex of this.invalid) {
				this.promises[invalidIndex] = changeHandler(invalidIndex);
			}
			this.invalid.length = 0;
		}
		if (this.values.length != this.sources.length) {
			// If this is the first time and we don't have any existing values then we need to await all the promises
			await Promise.all(this.promises);
		} else {
			// Otherwise we want to issue a new value as soon any of the promises resolve and use the existing values from all the other changes.
			await Promise.race(this.promises);
		}
		// Calculate the new value:
		this._value = this.evaluate(...this.values);
		console.log(`Computed: Setting to new value: ${this._value}`);
		this.inst = false;
		return this._value;
	}
	// TODO: Switch to futures
	async *[Symbol.asyncIterator]() {
		if (this._value === undefined) await this; // Don't issue a value until we've run evaluate at least once.
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
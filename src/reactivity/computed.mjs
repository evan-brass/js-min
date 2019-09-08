import NEVER from '../lib/never.mjs';
import range from '../lib/range.mjs';
import Reactor from './reactor.mjs';
import syncDepth from './sync-depth.mjs';

export default class ComputedValue {
	constructor(evaluate, ...sources) {
		this.evaluate = evaluate;
		// Make sure we have async iterables:
		this.dependencies = [];
		this.iterations = [];
		this.depth = 0;
		for (const source of sources.flat()) {
			// The dependency is the reactor instance for the source
			if (source instanceof Reactor) {
				const dependency = Reactor.get(source);
				this.dependencies.push(dependency);
				this.depth = Math.max(this.depth, dependency.depth + 1);
			} else {
				this.dependencies.push(false); // TODO: Do something else
			}
			// The iteration is the actual async iterator that we will pull new values from
			this.iterations.push(
				source.next ? source : source[Symbol.asyncIterator]()
			);
		}
		// Everything starts invalid:
		this.invalid = Array.from(range(0, this.iterations.length));
		// No initial values:
		this.values = [];
		// The promises will be filled in later when the computed is first evaluated
		this.promises = [NEVER];
		this.inst = false;
	}
	get [Reactor]() { return this; }
	then(...args) {
		if (!this.inst) this.inst = this.getNextValue();
		this.inst.then(...args);
	}
	async getNextValue() {
		// This updates the value with a result from an async iterator
		const changeHandler = async i => {
			const source = this.iterations[i];
			const {value, done} = await source.next(this.depth);
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
		if (this.values.length != this.iterations.length) {
			// If this is the first time and we don't have any existing values then we need to await all the promises
			await Promise.all(this.promises);
		} else {
			// Otherwise we want to issue a new value as soon any of the promises resolve and use the existing values from all the other changes.
			await Promise.race(this.promises);
		}
		// Calculate the new value:
		this._value = this.evaluate(...this.values);
		// console.log(`Computed: Setting to new value: ${this._value}`);
		this.inst = false;
		return this._value;
	}
	// TODO: Switch to futures
	async *[Symbol.asyncIterator]() {
		if (this._value === undefined) await this; // Don't issue a value until we've run evaluate at least once.
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
}
// @flow

/*
 How do we do auto dependency discovery?  The current system uses async iterators to get access to a value.  This was fine for explicit dependencies but to discover the dependencies that we need in a dynamic way requires running the function first to build the dependency list.  I've been intending to use a Proxy for this but I'd kinda assumed that accessing the value would be syncronous.  I'm not sure that the current system could be syncronous though.  One way to handle this could be to throw a special error (something like InputNotReady) and then await the next value before running the function again.  This seems really hacky, but it would mean that we would end the function and then continue running it again once the value was actually ready.  This also works out because if the function needed a second value, and then the first value changed, we would be able to start the function over again.  Too hacky?  Alternatively we could just require that dynamic discovery be an async function and suffer through the potential double updates.  I suppose that you could just replace the current instance with a new one if a previously requested value updates before the computation finishes.
 */
import Reactor from './reactor.mjs';
import syncDepth from './sync-depth.mjs';

export default class DynamicComputed {
	constructor(scope, func) {
		this.scope = scope;
		this.dependencies = [];
		this.sources = [];
	}
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
		console.log(`Computed: Setting to new value: ${this._value}`);
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
	get [Reactor] () { return this; }
	get depth() { 
		throw new Error(`I don't know how to handle updating the depth of dependents on a dynamic computed.`); 
	}
}
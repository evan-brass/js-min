import Never from 'lib/never.mjs';
import range from 'lib/range.mjs';

// TODO: Cancellation signals
export const Unchanged = Symbol("This symbol represent that the value of the Computed didn't change and therefore shouldn't propagate down.");

export function diff(compute) {
	let old_values = [];
	return function(...new_values) {
		const ret = compute(...new_values.map(
			(val, i) => ({n: val, o: old_values[i]})
		));
		old_values = new_values;
		return ret;
	};
}

const UnInit = Symbol("This symbol represents that the computed hasn't been run yet.");

export default class Computed {
	constructor(evaluate, ...sources) {
		this.evaluate = evaluate;
		// Get streams:
		this.sources = sources.flat().map(item => item[Symbol.asyncIterator]());

		this.values = [];
		this.current = UnInit;

		// Start with everything needing to be refreshed
		this._to_refresh = new Set(range(0, this.sources.length));
		
		// No promises until someone calls refresh the first time.
		this._promises = [];
	}
	async _make_next_value() {
		// Actually run the computation:
		let value;
		do {
			// Turn all the 
			for (const index of this._to_refresh.values()) {
				this._promises[index] = this.sources[index].next().then(({value, done}) => {
					if (!done) {
						this.values[index] = value;
						this._to_refresh.add(index);
					} else {
						// MAYBE: Should a stream end change the value?  Honestly, streams ending is weird to think about in this context anyway.
						this._promises[index] = Never;
					}
				});
			}
			this._to_refresh.clear();

			if (this.current === UnInit) {
				// If we've never calculated the computed than we need to wait for all the promises...
				await Promise.all(this._promises);
			} else {
				// ...Every other time, we just wait until any value changes and use the rest of the unchanged values.
				await Promise.race(this._promises);
			}

			// Evaluate the computed and check if the value changed:
			value = this.evaluate(...this.values);
		} while (value === Unchanged);

		this.current = value;
		this._next_value = false;
	}
	next_value() {
		if (!this._next_value) {
			this._next_value = this._make_next_value();
		}
		return this._next_value;
	}
	get value() {
		if (this.current === UnInit) {
			console.warn(new Error("Computed's value was accessed before the computed has run - returning undefined."));
			return undefined;
		} else {
			return this.current;
		}
	}
	async *[Symbol.asyncIterator]() {
		let prom = this.next_value();
		if (this.current !== UnInit) {
			// Yield the current value immediately:
			yield this.current;
		}
		while(true) {
			await prom;
			prom = this.next_value();
			yield this.current;
		}
	}
}
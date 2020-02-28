import wrapSignal from 'cancellation/wrap-signal.mjs';
import differed from 'lib/differed.mjs';

const UnInit = Symbol('This symbol means that no value has been set yet.');

export default class LiveData {
	constructor(initialValue = UnInit) {
		this._nextValue = differed();
		this._value = initialValue;
	}
	set value(newValue) {
		this._value = newValue;
		// Shouldn't be a problem because promise resolution happens in the microtask stage, but I might as well setup the new _nextValue before resolving the old one.
		const old = this._nextValue;
		this._nextValue = differed();
		old.res();
	}
	get value() {
		if (this._value === UnInit) {
			console.warn(new Error("Live Data accessed before a value was set - returning undefined."));
			return undefined;
		} else {
			return this._value;
		}
	}
	async *[Symbol.asyncIterator]() {
		// If we already have a value then we want to yield that right away.
		let prom = (this._value !== UnInit) ? Promise.resolve() : this._nextValue;
		let wrap = false;
		while (true) {
			await (wrap ? wrap(prom) : prom);
			prom = this._nextValue;
			const signal = yield this.value; // Always yield the most up to date value
			wrap = signal ? wrapSignal(signal) : false;
		}
	}
}
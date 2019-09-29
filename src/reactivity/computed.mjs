import { Reactive } from './reactive.mjs';

const Invalid = Symbol('This symbol indicates the Computed has an invalid value and needs to recompute.');

export default class ComputedValue extends Reactive.implementation {
	compare = (a, b) => a === b
	setCompare(func) { this.compare = func; return this; }
	constructor(evaluate, ...sources) {
		super();
		this.evaluate = evaluate;
		this.dependencies = sources.flat().map(src => {
			const reactive = Reactive.get(src);
			reactive.depend(this);
			return reactive;
		});
		this._value = Invalid;
	}
	get depth() {
		return Math.max(...this.dependencies.map(dep => dep.depth)) + 1;
	}
	get value() {
		if (this._value == Invalid) {
			this.update();
		}
		return this._value;
	}
	update() {
		// TODO: Only compute a new value if someone is depending on us.
		const newValue = this.evaluate(...this.dependencies.map(dep => dep.value));
		// TODO: Custom comparison functions
		if (!this.compare(newValue, this._value)) {
			this._value = newValue;
			this.propagate();
		}
	}
}
class SingleBase {
	constructor(initial, depth) {
		this._value = initial;
		this.watchers = new Set();
		this.depth = depth;
	}
	get value() {
		return this._value;
	}
	map(func) {
		return new (class SingleMap extends SingleBase {
			constructor(source, func) {
				super(func(source.value), source.depth + 1);
				source.watchers.add(newValue => {
					this._value = func(newValue);
					this.watchers.forEach(func => func(this.value));
				});
			}
		})(this, func);
	}
}

export function zip(func, ...sources) {
	return new (class SingleZip extends SingleBase {
		constructor(func, sources) {
			super(
				func(...(sources.map(s => s.value))),
				Math.max(...(sources.map(s => s.depth)))
			);
			const handler = _ => {
				this._value = func(...this(sources.map(s => s.value)));
				this.watchers.forEach(func => func(this.value));
			};
			sources.forEach(s => s.watchers.add(handler));
		}
	})(func, sources.flat());
}

export function state(initial) {
	return new (class SingleRoot extends SingleBase {
		constructor(initial) {
			super(initial, 0);
		}
		set value(newValue) {
			this._value = newValue;
			this.watchers.forEach(func => func(this.value));
			return true;
		}
		// Can't get rid of this getter unfortunately :(
		get value() {
			return this._value;
		}
	})(initial);
}

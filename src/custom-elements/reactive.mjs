import { aquire_waiters, queue_waiters } from "../reactivity/context.mjs";

function prop_to_attr(prop) {
	return prop.replace('_', '-');
}
function attr_to_prop(attr) {
	return attr.replace('-', '_');
}
function attr_to_value(attr_val) {
	// Handle boolean attributes:
	if (attr_val === undefined) {
		return false;
	} else if (attr_val === '') {
		return true;
	} else {
		return attr_val;
	}
}

export default function reactive(map, inherit) {
	const ret = class Reactive extends inherit {
		_waiters = {}
		_did_change = {}
		_values = {}
		constructor(...args) {
			super(...args);

			// Create the wakers:
			for (const key in map) {
				this._waiters[key] = new Set();
			}
			// Assign the did_change functions:
			for (const key in map) {
				const entry = map[key];
				if (typeof entry === 'object' && typeof entry.did_change === 'function') {
					this._did_change[key] = entry.did_change;
				}
			}
			// Assign the initial values:
			// Priority:
			//   1. Properties set on the element before it was upgraded
			//   2. Attributes on the element
			//   3. The initial value from the map
			// TODO: Reflect to attribute?
			for (const key in map) {
				const attr_val = this.getAttribute(prop_to_attr(key));
				if (this.hasOwnProperty(key)) {
					this._values[key] = this[key];
					delete this[key];
				} else if (attr_val !== undefined) {
					this._values[key] = attr_to_value(attr_val);
				} else {
					const entry = map[key];
					if (typeof entry === 'object' && entry.initial !== undefined) {
						this._values[key] = entry.initial;
					} else {
						this._values[key] = entry;
					}
				}
			}
		}
		attributeChangedCallback(name, oldValue, newValue) {
			const key = attr_to_prop(name);
			const value = attr_to_value(newValue);

			// Trigger the setter:
			this[key] = value;
		}
		static get observedAttributes() {
			return Object.keys(map).map(prop_to_attr);
		}
		_default_did_change(a, b) {
			return a !== b;
		}
	};

	// Add the getters / setters for all the properties:
	for (const key in map) {
		Object.defineProperty(ret.prototype, key, {
			get() {
				aquire_waiters(this._waiters[key]);

				return this._values[key];
			},
			set(value) {
				const old = this._values[key];
				const did_change = (key in this._did_change ?
					this._did_change[key] :
					this._default_did_change
				)(old, value);

				this._values[key] = value;

				if (did_change) {
					this._waiters[key] = queue_waiters(this._waiters[key]);
				}
			}
		});
	}

	return ret;
}
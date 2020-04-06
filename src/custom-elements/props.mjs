/* Formats: 
{
	prop1: Number,
	prop2: {
		type: Number,
		default: 5
	},
	prop3: {
		type: Number,
		default() {
			return document.body.childNodes.length;
		}
	}
}
*/
// TODO: Probably need a camel to kebbab case thing but it's ok for now.
// TODO: Switch to class decorators instead of the property object.  Do the same to enable computed properties and computed properties with dynamic dependencies.
import LiveData from '../reactivity/live-data.mjs';

export default function props(definitions, inherit = HTMLElement) {
	// Build class
	class Properties extends inherit {
		constructor() {
			super();
			this._data = {};
			// Setup the live data objects
			for (const key in definitions) {
				const def = definitions[key].default;

				let initial_value;
				// eslint-disable-next-line no-prototype-builtins
				if (this.hasOwnProperty(key)) {
					// Our element had a property set before it was upgraded -> use as initial value and delete it.
					initial_value = this[key];
					delete this[key];
				} else if (def !== undefined) {
					// No initial property so use the default if there is one.
					initial_value = (def instanceof Function) ? def.call(this) : def;
				}

				this._data[key] = new LiveData(initial_value);
			}
		}
		attributeChangedCallback(key, _, newValue) {
			const def = definitions[key];
			if (def.type !== String) {
				// Use the setters from the class
				this[key] = new (def.type)(newValue);
			} else {
				this[key] = newValue;
			}
		}
	}
	for (const key in definitions) {
		// Normalize / expand the definitions for later
		if (!definitions[key].type) {
			definitions[key] = {
				type: definitions[key]
			};
		}

		Object.defineProperty(Properties.prototype, key, {
			get() {
				return this._data[key].value;
			},
			set(newValue) {
				this._data[key].value = newValue;
				return true;
			}
		});
	}
	
	const oldObservedAttributes = inherit.observedAttributes || [];
	Object.defineProperty(Properties, 'observedAttributes', {
		value: oldObservedAttributes.concat(Object.keys(definitions))
	});

	return Properties;
}
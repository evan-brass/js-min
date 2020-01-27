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
import LiveData from './reactivity/live-data.mjs';

export default function props(definitions, inherit = HTMLElement) {
	// Build class
	class Properties extends inherit {
		constructor() {
			super();
			this._data = {};
			// Setup the live data objects
			for (const key in definitions) {
				const def = definitions[key];
				this._data[key] = new LiveData();

				// For when someone sets the properties of our element before we've been upgraded.
				if (this.hasOwnProperty(key)) {
					const presetValue = this[key];
					delete this[key];
					this._data[key].value = presetValue;
				} else if (definitions[key].default) {
					// Only use the default if the prop hasn't been set already
					this._data[key].value = (def instanceof Function) ? 
					def.call(this) :
					def;
				}
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
		// Normallize / expand the definitions for later
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
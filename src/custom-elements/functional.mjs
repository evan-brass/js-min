import Base from './base.mjs';
import { attach_state, setup_state } from '../reactivity/signal.mjs';
import { apply_expression_part } from '../templating/apply-expression.mjs';
import PartList from '../templating/part-list.mjs';
import { anadv, env_access_src } from '../lib/anadv.mjs';
export { env_access_src };

function prop_to_attr(prop) {
	return prop.replace('_', '-');
}
function attr_to_prop(attr) {
	return attr.replace('-', '_');
}

export function define(func, env_access) {
	const valid_re = /[a-z][a-z0-9]*_[a-z0-9_]+/;
	// Get the name for this custom element
	const func_name = func.name;
	if (!func_name.match(valid_re)) {
		throw new Error("Function name must be a valid custom element name except with underscores instead of hyphens.");
	}
	const el_name = prop_to_attr(func_name);

	// Get the argument names and their default values:
	const [arg_names, defaults] = anadv(func, env_access);

	// Get the constructor for each default.
	// When an attribute is changed, it will be a string (or null) and we use this constructor on that string before passing the value to our setter.
	const cons = {};
	for (const key of arg_names) {
		if (!key.match(/[a-z][a-z0-9_]*/)) {
			throw new Error("All argument names must be valid attribute names except with underscores instead of hyphens.");
		}
		const def = defaults[key];
		cons[key] = (def === undefined) ? String : def.constructor;
	}

	class NewEl extends Base {
		constructor() {
			super();

			setup_state(this);

			for (const key of arg_names) {
				if (this.hasOwnProperty(key)) {
					const v = this[key];
					delete this[key];
					this[key] = v;
				}
			}
		}
		async run(signal) {
			const part_list = new PartList(this.shadowRoot);

			const expr = func.apply(this, arg_names.map(key => () => this[key]));
			apply_expression_part(expr, part_list, 0, signal);
		}
		attributeChangedCallback(name, _old_value, new_value) {
			const prop = attr_to_prop(name);
			this[prop] = new cons[prop](new_value);
		}
	}
	NewEl.observedAttributes = [];
	for (const key of arg_names) {
		NewEl.observedAttributes.push(prop_to_attr(key));

		attach_state(NewEl.prototype, key, defaults[key]);
	}

	customElements.define(el_name, NewEl);

	return NewEl;
}
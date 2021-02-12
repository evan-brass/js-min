import { Handler } from './expr.mjs';

// TODO: Using objects instead of functions makes composing handlers more difficult, but I think it can work.  One problem could be naming conflicts between properties when extending a handler.

export function ref(func) {
	return {
		func,
		[Handler](builder, init, i) {
			let el_finder = builder.get_descendant_path();

			return (frag, values, ...args) => {
				const el = el_finder(frag);
				values[i].func(el);
			
				return init(frag, values, ...args);
			};
		}
	};
}

// Only valid anywhere that an HTML comment can be placed.  For example: Not possible as a direct descendant of a table or tr element because comments aren't permitted content there.
export function text(func) {
	const ref_value = ref(el => {
		const text = new Text();
		el.replaceWith(text);
		func(text);
	});
	const old_handler = ref_value[Handler];
	const ret = Object.create(ref_value);
	ret[Handler] = (builder, init, i) => {
		builder.advance('<!--');
		const ret = old_handler(builder, init, i);
		builder.advance('-->');
	
		return ret;
	};
	return ret;
}

export function on(event, handler) {
	return ref(function add_event_listener(el) {
		el.addEventListener(event, handler);
	});
}
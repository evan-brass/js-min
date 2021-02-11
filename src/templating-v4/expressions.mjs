import Handler from './expr.mjs';

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
	return {
		func,
		[Handler](builder, init, i) {
			builder.advance('<!--');
			// TODO: Can't nest handlers like I used too.
			const ret = ref(el => {
				const text = new Text();
				el.replaceWith(text);
				func(text);
			})(builder, init);
			builder.advance('-->');
			return ret;
		}
	};
}

export function on(event, handler) {
	return ref(function add_event_listener(el) {
		el.addEventListener(event, handler);
	});
}
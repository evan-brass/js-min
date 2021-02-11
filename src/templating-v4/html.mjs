import Parser from './parser.mjs';
import Handler from './expr.mjs';
import get_handler from './expr.mjs';
import get_or_set from '../lib/get-or-set.mjs';

const template_cache = new WeakMap();

export function template(strings, ...values) {
	const {template, init} = get_or_set(template_cache, strings, () => {
		const parser = new Parser();
		const init = html(strings, ...values)(parser, frag => frag, 0);
		const template = parser.finish();

		return { template, init };
	});
	return (...args) => {
		const val = html(strings, ...values);
		const frag = document.importNode(template.content, true);
		return init(frag, [val], ...args);
	};
}

export function html(strings, ...values) {
	return {
		strings,
		values,
		[Handler](parser, init, i) {
			let i;
			for (i = 0; i < values.length; ++i) {
				const str = strings[i];
				const handler = get_handler(values[i]);
				parser.advance(str);
				init = handler(parser, init, i);
			}
			parser.advance(strings[i]);
		
			return (frag, values, ...args) => {
				// Swap values so that inner inits are fed the values from this call to html
				init(frag, values[i].values, ...args);
			};
		}
	};
}
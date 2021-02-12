import Parser from './parser.mjs';
import { get_handler, Handler } from './expr.mjs';
import get_or_set from '../lib/get-or-set.mjs';
import Trait from '../lib/trait.mjs';

export const CacheKey = new Trait("Key by which this handler should be cached.");

const template_cache = new WeakMap();

export function inst(value, ...args) {
	function build() {
		const parser = new Parser();
		const init = get_handler(value)(parser, frag => frag, 0);
		const template = parser.finish();
	
		return { template, init };
	}
	const {template, init} = value instanceof CacheKey ? 
		get_or_set(template_cache, CacheKey.get(value), build) : 
		build();
	
	// Instantiate:
	const frag = document.importNode(template.content, true);
	const ret = init(frag, [value], ...args);
	if (frag !== ret) {
		throw new Error("The init should return the same document fragment as was passed into it.");
	}
	return ret;
}

export function html(strings, ...values) {
	return {
		[CacheKey]: strings,
		values,
		[Handler](parser, init, i) {
			let j;
			for (j = 0; j < values.length; ++j) {
				const str = strings[j];
				const handler = get_handler(values[j]);
				parser.advance(str);
				init = handler(parser, init, j);
			}
			parser.advance(strings[j]);
		
			return (frag, values, ...args) => {
				// Swap values so that inner inits are fed the values from this call to html
				return init(frag, values[i].values, ...args);
			};
		}
	};
}
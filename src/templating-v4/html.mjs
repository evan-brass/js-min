import parse_html from './parser.mjs';
import default_get_handler from './expr.mjs';

class TemplateBuilder {
	#html = ""
	constructor() {
		const [stack, append, parser] = parse_html();
		this.stack = stack;
		this.expression_index = 0;
		this.#append = append;
		this.#parser = parser;
		this.#init_funcs = [];
	}
	advance(html) {
		this.#html += html;
		this.#append(html);
		this.#parser.next();
	}
	add_init(func) {
		this.#init_funcs.push({func, ind: this.expression_index});
	}
	finish() {
		this.#parser.return();
		const template = document.createElement('template');
		template.innerHTML = this.#html;
		const inits = this.#init_funcs;
		return function template_instantiate(values, signal = new AbortController().signal) {
			const fragment = document.importNode(template.content, true);
			for (const {func, ind} of inits) {
				func.call(values[ind], fragment, signal);
			}
			return fragment;
		};
	}
}

const instantiate_cache = new Map();

export function make_html(get_handler = default_get_handler) {
	return function html(strings, ...values) {
		return function (builderOrFalse = false) {
			if (builderOrFalse == false && instantiate_cache.has(strings)) {
				return instantiate_cache.get(strings).bind(null, values);
			}
			const builder = builderOrFalse || new TemplateBuilder();
			for (let i = 0; i < values.length; ++i) {
				const str = strings[i];
				const value = values[i];
				builder.advance(str);
				builder.expression_index = i;
				get_handler(value).call(value, builder);
			}
			builder.add_html(strings[strings.length - 1]);
			if (!builderOrFalse) {
				const instantiate = builder.finish();
				instantiate_cache.set(strings, instantiate);
				return instantiate.bind(values);
			}
		};
	};
}
export const html = make_html();
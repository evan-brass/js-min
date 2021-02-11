import TemplateBuilder from './template-builder.mjs';
import get_or_set from '../lib/get-or-set.mjs';
import apply_expression from './expr.mjs';

const template_cache = new WeakMap();

export function template(strings, ...expressions) {
	// It's sad that we need two different template tags: template and html
	// Would be nice if you could instead use: template(html``) but template needs access to the strings so that it can cache it's result.
	const builder = new TemplateBuilder();
	html(strings, ...expressions)(builder);
	return builder.finish();
}

export function html (strings, ...expressions) {
	return function (builder) {
		for (let i = 0; i < expressions.length; ++i) {
			const str = strings[i];
			const expr = expressions[i];
			builder.add_html(str);
			apply_expression(expr, builder);
		}
		builder.add_html(strings[strings.length - 1]);
	};
}
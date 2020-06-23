import create_template from './create-template.mjs';
import instantiate_template from './instantiate-template.mjs';
import expression_handler from './expression-handler.mjs';

const template_cache = new WeakMap();

export function make_html(expression_handler) {
	return function html(strings, ...expressions) {
		let template = template_cache.get(strings);
		if (!template) {
			template = create_template(strings);
			template_cache.set(strings, template);
		}

		return instantiate_template(template, (index, target_node, kind) => {
			expression_handler(expressions[index], target_node, kind, expression_handler);
		});
	}
}

export default make_html(expression_handler);
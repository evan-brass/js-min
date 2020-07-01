import create_template from './create-template.mjs';
import instantiate_template from './instantiate-template.mjs';
import expression_to_handler from './expression-to-handler.mjs';
import PartHandler from './part-handler.mjs';

const template_cache = new WeakMap();

export function make_html(e2h = expression_to_handler) {
	return function html(strings, ...expressions) {
		let template = template_cache.get(strings);
		if (!template) {
			template = create_template(strings);
			template_cache.set(strings, template);
		}

		// TODO: Catch expressions that don't have associated parts / mismatched expressions and parts.

		return {
			[PartHandler](target_node, signal) {
				const fragment = instantiate_template(template, (index, element, kind) => {
					const handler = e2h(expressions[index], kind, e2h)(element, signal);
				});
				target_node.replaceWith(fragment);
			}
		};
	}
}

export default make_html();
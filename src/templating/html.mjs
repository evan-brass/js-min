import create_template from './create-template.mjs';
import zip from '../lib/zip.mjs';
import get_or_set from '../lib/get-or-set.mjs';
import { apply_expression_part, apply_expression_attribute } from './apply-expression.mjs';
import PartList from './part-list.mjs';

// Cache: strings -> template element
const template_cache = new WeakMap();
// Cache: template element -> template instance
const instance_cache = new WeakMap();

function get_instance(template) {
	const pool = get_or_set(instance_cache, template, () => []);
	if (pool.length == 0) {
		return document.importNode(template.content, true);
	} else {
		return pool.pop();
	}
}

export function make_html(apply_part = apply_expression_part, apply_expr = apply_expression_attribute) {
	return function html(strings, ...expressions) {
		// Get the template 
		const { template, part_getter } = get_or_set(template_cache, strings, create_template.bind(undefined, strings));

		// Get the instance
		const instance_fragment = get_instance(template);

		return function html_part_handler(part_list, index, signal) {
			const parts = part_getter(instance_fragment);

			// Apply our expressions
			for (const [element, expr] of zip(parts, expressions)) {
				if (element instanceof Comment) {
					apply_part(expr, new PartList(element), 0, signal);
				} else {
					apply_expr(expr, element, signal);
				}
			}

			// Splice our html into the part_list
			part_list.splice(index, 0, instance_fragment);
			const ref = part_list.refs[index];

			// We add our abort listener after applying all the previous expressions so that it runs last since it cleans up the fragment and puts it into a pool.
			signal.addEventListener('abort', function return_instance() {
				const [fragment] = part_list.splice(ref, 1);

				const pool = instance_cache.get(template);
				if (pool !== undefined) {
					pool.push(fragment);
				}
			});
		};
	}
}

export default make_html();

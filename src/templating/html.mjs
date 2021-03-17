import create_template from './create-template.mjs';
import apply_expression from './apply-expression.mjs';
import zip from '../lib/zip.mjs';
import get_or_set from '../lib/get-or-set.mjs';

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

export function make_html(apply_expr = apply_expression) {
	return function html(strings, ...expressions) {
		// Get the template 
		const { template, part_getter } = get_or_set(template_cache, strings, create_template.bind(undefined, strings));

		// Get the instance
		const instance_fragment = get_instance(template);

		return function html_part_handler(target_node, signal) {
			const parts = part_getter(instance_fragment);

			// Apply our expressions
			for (const [element, expr] of zip(parts, expressions)) {
				apply_expr(expr, element, signal);
			}

			// We add our abort listener after applying all the previous expressions so that it runs last since it cleans up the fragment and puts it into a pool.
			let first = instance_fragment.firstChild;
			let last = instance_fragment.lastChild;
			signal.addEventListener('abort', function return_instance() {
				const frag = new DocumentFragment();
				let comment = new Comment();
				first.before(comment);
				while (comment.nextSibling != last) {
					frag.appendChild(comment.nextSibling);
				}
				frag.appendChild(last);

				const pool = instance_cache.get(template);
				if (pool !== undefined) {
					pool.push(fragment);
				}
			});

			target_node.replaceWith(instance_fragment);
		};
	}
}

export default make_html();

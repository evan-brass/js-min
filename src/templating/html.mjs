import create_template from './create-template.mjs';
import apply_expression from './apply-expression.mjs';
import zip from '../lib/zip.mjs';
import get_or_set from '../lib/get-or-set.mjs';

// So, I assumed that comment nodes would be valid html everywhere that I cared about but that's not the case.  I knew they weren't allowed in style tags, but I just found out that they're also not allowed inside tables: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/table
// So... Does this mean a redesign?

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
function return_instance(template, fragment) {
	const pool = instance_cache.get(template);
	if (pool !== undefined) {
		pool.push(fragment);
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
			const num_top_nodes = instance_fragment.childNodes.length;
			signal.addEventListener('abort', () => {
				const frag = new DocumentFragment();
				for (let _ = 0; _ < num_top_nodes; ++_) {
					frag.appendChild(target_node.nextSibling);
				}

				return_instance(template, frag);
			});

			// TODO: Kinda clunky to leave the comment node.
			target_node.after(instance_fragment);
		};
	}
}

export default make_html();

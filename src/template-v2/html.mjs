import create_template from './create-template.mjs';
import apply_expression from './apply-expression.mjs';

const template_cache = new WeakMap();

// Zip two arrays together:
function* zip(a, b) {
	if (a.length !== b.length) {
		throw new Error('Cannot zip arrays of different length.');
	}
	for (let i = 0; i < a.length; ++i) {
		yield [a[i], b[i]];
	}
}
// Get a value from a map or set it using a create function if it doesn't exist.
function get_or_set(map, key, create_func) {
	let ret = map.get(key);
	if (ret === undefined) {
		ret = create_func();
		map.set(key, ret);
	}
	return ret;
}

export function make_html(apply_expr = apply_expression) {
	return function html(strings, ...expressions) {
		const { template, part_getter } = get_or_set(template_cache, strings, () => create_template(strings));

		return (target_node, signal) => {
			const fragment = document.importNode(template.content, true);
			const parts = part_getter(fragment);
			for (const [element, expr] of zip(parts, expressions)) {
				apply_expr(expr, element, signal);
			}

			target_node.replaceWith(fragment);
		};
	}
}

export default make_html();
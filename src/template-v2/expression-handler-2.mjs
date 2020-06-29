import Trait from '../lib/trait.mjs';

export const CustomHandler = new Trait('This object has a custom handler.');

export default function expression_handler(expression, target_node, part_kind, recursive_handler) {
	const expr_type = typeof expression;
	if (expr_type == 'undefined') {
		console.warn('Unused part (expression was undefined):', target_node, part_kind); return;
	} else if (expression === null) {
		console.warn('Unused part (expression was null):', target_node, part_kind); return;
	} else if (expr_type == 'object' && expression instanceof CustomHandler) {
		expression[CustomHandler](target_node, part_kind, recursive_handler);
	} else if (expr_type == 'function') {
		expression(target_node, part_kind, recursive_handler); return;
	}
	if (part_kind == 'node') {
		if (expr_type == 'number' || expr_type == 'bigint') {
			target_node.replaceWith(new Text(expression.toString())); return;
		} else if (expr_type == 'string') {
			target_node.replaceWith(new Text(expression)); return;
		} else if (expr_type == 'object') {
			if (expression instanceof Node) {
				target_node.replaceWith(expression); return;
			} else if (expression[Symbol.iterator] !== undefined) {
				// Create a new comment node for each sub expression.
				for (const sub of expression) {
					let new_node = new Comment();
					target_node.parentNode.insertBefore(new_node, target_node);
					recursive_handler(sub, new_node, 'node', recursive_handler);
				}
				target_node.remove(); return;
			} else if (expression[Symbol.asyncIterator] !== undefined) {
				const before = new Text();
				const after = new Text();
				target_node.replaceWith(before, after);
				(async () => {
					for await (const sub of expression) {
						// TODO: Enable swapping so that if it's just a new string then we update the previous text node instead of deleting it and adding a new one.
						while (after !== before.nextSibling) before.nextSibling.remove();
						const temp = new Comment();
						before.parentNode.insertBefore(temp, after);
						recursive_handler(sub, temp, 'node', recursive_handler);
					}
				})();
				return;
			}
		}
	} else if (part_kind == 'attribute') {
		if (expr_type == 'string') {
			if (expression !== '') {
				target_node.setAttribute(expression, '');
			}
			return;
		} else if (expr_type == 'object') {
			 if (expression[Symbol.iterator] !== undefined) {
				for (const sub of expression) {
					recursive_handler(sub, target_node, 'attribute', recursive_handler);
				}
				return;
			}
		}
	}
	throw new Error("Don't know how to match this expression with this part kind.");
}
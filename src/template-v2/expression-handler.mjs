import Trait from '../lib/trait.mjs';

export const CustomHandler = new Trait('This object has a custom handler.');

export default function expression_handler(expression, target_node, part_kind, recursive_handler) {
	const expr_type = typeof expression;
	if (expr_type == 'number' || expr_type == 'bigint') {
		if (part_kind == 'node') {
			target_node.replaceWith(new Text(expression.toString()));
		} else {
			throw new Error('Numbers (and BigInts) can only be placed in node position.');
		}
	} else if (expr_type == 'undefined') {
		console.warn('Unused part (expression was undefined): ', target_node, part_kind);
	} else if (expr_type == 'string') {
		if (part_kind == 'node') {
			target_node.replaceWith(new Text(expression));
		} else if (part_kind == 'attribute') {
			if (expression !== '') {
				target_node.setAttribute(expression, '');
			}
		}
	} else if (expr_type == 'function') {
		expression(target_node, part_kind, recursive_handler);
	} else if (expr_type == 'object') {
		if (expression === null) {
			console.warn('Unused part (expression was null): ', target_node, part_kind);
		} else {
			if (expression instanceof CustomHandler) {
				expression[CustomHandler](target_node, part_kind, recursive_handler);
			} else if (expression instanceof Node) {
				if (part_kind == 'node') {
					target_node.replaceWith(expression);
				} else {
					throw new Error("Don't know what to do with a Node in a non-node part kind.");
				}
			} else if (expression[Symbol.iterator] !== undefined) {
				if (part_kind == 'node') {
					// Create a new comment node for each sub expression.
					for (const sub of expression) {
						let new_node = new Comment();
						target_node.parentNode.insertBefore(new_node, target_node);
						recursive_handler(sub, new_node, 'node', recursive_handler);
					}
					target_node.remove();
				} else if (part_kind == 'attribute') {
					// Just share the node for each:
					for (const sub of expression) {
						recursive_handler(sub, target_node, 'attribute', recursive_handler);
					}
				} else {
					throw new Error('Not sure what to do with an iterable thing with this kind: ' + part_kind);
				}
			} else if (expression[Symbol.asyncIterator] !== undefined) {
				// The default for async iterable things is to replace* the value in the node
				if (part_kind == 'node') {
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
				} else {
					throw new Error("Currently don't support async iterable objects in an attribute part.");
				}
			} else {
				throw new Error("I don't know what to do with this object: ", expression, target_node, part_kind);
			}
		}
	} else {
		throw new Error("I don't know what to do with this boolean/symbol: " + expression);
	}
}
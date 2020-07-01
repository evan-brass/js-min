import PartHandler from './part-handler.mjs';

export default function expression_to_handler(expression, kind, recursive_handler) {
	const expr_type = typeof expression;
	if (expression instanceof PartHandler) {
		return (target_node, signal) => expression[PartHandler](target_node, signal, kind);
	} else if (expr_type == 'undefined' || expression === null) {
		return () => undefined;
	} else if (expr_type == 'function') {
		return (target_node, signal) => {
			expression(target_node, signal, kind);
		};
	}
	if (kind == 'node') {
		if (expr_type == 'number' || expr_type == 'bigint' || expr_type == 'string') {
			return (target_node, _signal) => {
				target_node.replaceWith(new Text(
					(typeof expression == 'string') ? expression : expression.toString())
				);
			};
		} else if (expr_type == 'object') {
			if (expression instanceof Node) {
				return (target_node, _signal) => {
					target_node.replaceWith(node);
				};
			} else if (expression[Symbol.iterator] !== undefined) {
				return (target_node, signal) => {
					// Create a new comment node for each sub expression.
					for (const sub of expression) {
						let new_node = new Comment();
						target_node.parentNode.insertBefore(new_node, target_node);
						recursive_handler(sub, 'node', recursive_handler)(new_node, signal);
					}
					target_node.remove();
				};
			} else if (expression[Symbol.asyncIterator] !== undefined) {
				return (target_node, signal) => {
					const before = new Text();
					const after = new Text();
					target_node.replaceWith(before, after);
					(async () => {
						let prev_cont;
						for await (const sub of expression) {
							if (prev_cont) {
								prev_cont.abort();
							}
							prev_cont = new AbortController();
							signal.addEventListener('abort', _ => step_cont.abort(), { once: true });

							// Clean the frame:
							while (after !== before.nextSibling) before.nextSibling.remove();

							const temp = new Comment();
							before.parentNode.insertBefore(temp, after);

							recursive_handler(sub, 'node', recursive_handler)(temp, step_cont.signal);
						}
					})();
				};
			}
		}
	} else if (kind == 'attribute') {
		if (expr_type == 'string') {
			return (target_node, _signal) => {
				if (expression !== '') {
					target_node.setAttribute(expression, '');
				}
			};
		} else if (expr_type == 'object') {
			if (expression[Symbol.iterator] !== undefined) {
				return (target_node, signal) => {
					for (const sub of expression) {
						recursive_handler(sub, 'attribute', recursive_handler)(target_node, signal);
					}
				}
			}
		}
	}
	throw new Error("Don't know how to match this expression with this part kind.");
}
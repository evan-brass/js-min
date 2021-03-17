import PartHandler from './part-handler.mjs';

// apply_expression is what special cases expressions like primitives, arrays, functions, and nodes.
// To add your own special-cased expressions, you can edit this function or you can create a new function and then use make_html, and make_mount to create new html and mount functions that will use your special casing function.
export default function apply_expression(expression, target_node, signal) {
	const expr_type = typeof expression;
	if (expression instanceof PartHandler) {
		// If the object implements PartHandler, call the PartHandler method.
		expression[PartHandler](target_node, signal);
	} else if (expr_type == 'undefined' || expression === null) {
		// Do nothing.
	} else if (expr_type == 'function') {
		// For functions, just pass on the target_node and signal.
		expression(target_node, signal);
	} else if ((expr_type == 'number' || expr_type == 'bigint' || expr_type == 'string') && target_node.nodeType == Node.COMMENT_NODE) {
		// For primitives, create a text node and use toString.
		let text = new Text();
		text.data = expression.toString();
		target_node.replaceWith(text);
		signal.addEventListener('abort', _ => text.replaceWith(new Comment()));
	} else if (expr_type == 'object') {
		if (expression instanceof Node && target_node.nodeType == Node.COMMENT_NODE) {
			// Replace the target with the node
			target_node.replaceWith(expression);
			signal.addEventListener('abort', () => expression.replaceWith(new Comment()));
		} else if (expression[Symbol.iterator] !== undefined && target_node.nodeType == Node.COMMENT_NODE) {
			// Create a new comment node for each sub expression.
			for (const sub of expression) {
				let new_node = new Comment();
				target_node.before(new_node);
				apply_expression(sub, new_node, signal);
			}
			target_node.remove();
		} else if (expression[Symbol.iterator] !== undefined && target_node.nodeType !== Node.COMMENT_NODE) {
			// Share the target node.
			for (const sub of expression) {
				apply_expression(sub, target_node, signal);
			}
		} else {
			throw new Error("Don't know how to handle this expression with this target_node")
		}
	} else {
		throw new Error("Don't know how to handle this expression with this target_node.");
	}
}
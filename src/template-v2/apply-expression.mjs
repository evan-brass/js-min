import PartHandler from './part-handler.mjs';

export default function apply_expression(expression, target_node, signal) {
	const expr_type = typeof expression;
	if (expression instanceof PartHandler) {
		expression[PartHandler](target_node, signal);
	} else if (expr_type == 'undefined' || expression === null) {
		// Do nothing.
	} else if (expr_type == 'function') {
		expression(target_node, signal);
	} else if ((expr_type == 'number' || expr_type == 'bigint' || expr_type == 'string') && target_node.nodeType == Node.COMMENT_NODE) {
		target_node.replaceWith(expression.toString());
	} else if (expr_type == 'object') {
		if (expression instanceof Node) {
			target_node.replaceWith(expression);
		} else if (expression[Symbol.iterator] !== undefined && target_node.nodeType == Node.COMMENT_NODE) {
			// Create a new comment node for each sub expression.
			for (const sub of expression) {
				let new_node = new Comment();
				target_node.before(new_node);
				apply_expression(sub, new_node, signal);
			}
			target_node.remove();
		} else if (expression[Symbol.iterator] !== undefined && target_node.nodeType == Node.COMMENT_NODE) {
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
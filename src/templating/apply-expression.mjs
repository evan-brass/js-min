import { PartHandler, AttrHandler } from './handler-types.mjs';
import { sink_replace } from './expressions.mjs';

// This file is where all the special casing is.  If you want to add special cases, you can change this file or use the make_html, and make_mount functions to use your own special case functions.
class SpecialCaseError extends Error {
	constructor() {
		super("This expression doesn't work for this location.  Perhaps you should add a special case for it.");
	}
}

export function apply_expression_attribute(expression, node, signal) {
	const expr_type = typeof expression;
	if (expression instanceof AttrHandler) {
		expression[AttrHandler](node, signal);
	} else if (expr_type == 'undefined' || expression === null) {
		// Do nothing.
	} else if (expr_type == 'function') {
		expression(node, signal);
	} else if (expression[Symbol.iterator] !== undefined) {
		// Share the target node.
		for (const sub of expression) {
			apply_expression_attribute(sub, node, signal);
		}
	} else {
		throw new SpecialCaseError();
	}
}

export function apply_expression_part(expression, part_list, index, signal) {
	const expr_type = typeof expression;
	if (expression instanceof PartHandler) {
		expression[PartHandler](part_list, index, signal);
	} else if (expr_type == 'undefined' || expression === null) {
		// Do nothing.
	} else if (expr_type == 'function') {
		expression(part_list, index, signal);
	} else if (
		expr_type == 'number' ||
		expr_type == 'bigint' ||
		expr_type == 'string' ||
		expression instanceof Node
	) {
		part_list.splice(index, 0, expression);
		const ref = part_list.refs[index];
		signal.addEventListener('abort', () => part_list.splice(ref, 1));
	} else if (expression[Symbol.Iterator] !== undefined) {
		for (const expr of expression) {
			apply_expression_part(expr, part_list, index++, signal);
		}
	} else if (expression[Symbol.AsyncIterator] !== undefined) {
		apply_expression_part(sink_replace(expression), part_list, index, signal);
	} else {
		throw new SpecialCaseError();
	}
}
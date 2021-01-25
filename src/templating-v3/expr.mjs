import ref from './ref.mjs';
import placeholder from './placeholder.mjs';

export default function apply_expression(expression, builder) {
	const expr_type = typeof expression;
	if (expr_type == 'undefined' || expression === null) {
		// Do nothing.
	} else if (expr_type == 'function') {
		expression(builder);
	} else if ((expr_type == 'number' || expr_type == 'bigint' || expr_type == 'string')) {
		builder.add_html(expression.toString());
	} else if (expr_type == 'object') {
		// TODO: let objects override their expression handline
		throw new Error("Don't have a default handler for this type of expression.");
	} else {
		throw new Error("Don't have a default handler for this type of expression.");
	}
}
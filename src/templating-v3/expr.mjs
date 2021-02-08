import Trait from '../lib/trait.mjs';

export const TemplateExpression = new Trait("A Template Expression");

class Expression {
	init(root, )
	apply(builder) {

	}
	get [TemplateExpression]() {
		return this;
	}
}

export default function get_expression(expression, builder) {
	let handler;
	if (expression instanceof TemplateExpression) {
		TemplateExpression.get(expression);
	}
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
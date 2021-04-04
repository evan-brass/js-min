import { apply_expression_part } from "./apply-expression.mjs";
import PartList from './part-list.mjs';

export function make_mount(apply_expr = apply_expression_part) {
	return function mount(expression, root = document.body) {
		const controller = new AbortController();

		const pl = new PartList(root);

		apply_expr(expression, pl, 0, controller.signal);

		return () => controller.abort();
	};
}

export default make_mount();
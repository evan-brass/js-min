import expression_handler from './expression-handler.mjs';

export function make_mount(expression_handler) {
	return function mount(expression, root = document.body) {
		const temp = new Text();
		root.appendChild(temp);
		expression_handler(expression, temp, 'node', expression_handler);
	};
}

export default make_mount(expression_handler);
import expression_to_handler from './expression-to-handler.mjs';

export function make_mount(e2h = expression_to_handler) {
	return function mount(expression, root = document.body) {
		const controller = new AbortController();

		const temp = new Text();
		root.appendChild(temp);

		e2h(expression, 'node', e2h)(temp, controller.signal);

		return () => controller.abort();
	};
}

export default make_mount();
import { push_context, pop_context } from './context.mjs';

export function use(func, signal = false) {
	const wrapper = function use_wrapper() {
		if (signal == false || !signal.aborted) {
			push_context(wrapper);
			
			func();
			
			pop_context(wrapper);
		}
	};
	wrapper();
}

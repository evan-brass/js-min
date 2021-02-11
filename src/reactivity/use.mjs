import { push_context, pop_context } from './context.mjs';

export default function use_now(func, signal = false) {
	use_later(func, signal)(); // Inefficient, but reduces code duplication.
}

export function use_later(func, signalOrStealLast = false) {
	let signal;
	let args;
	const wrapper = function use_wrapper() {
		if (signal == false || !signal.aborted) {
			push_context(wrapper);
			
			func(...args);
			
			pop_context(wrapper);
		}
	};

	return function use_later_called(...args_in) {
		if (signalOrStealLast == true) {
			signal = args_in.pop();
		} else {
			signal = signalOrStealLast;
		}
		args = args_in;
		wrapper();
	}
}

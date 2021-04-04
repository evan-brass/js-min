import { apply_expression_part } from './apply-expression.mjs';
import { wrap_signal, derive_signal } from '../lib/signal-helpers.mjs';

// Event Handling
export function on(event, handler, options = {}) {
	return (target, signal) => {
		target.addEventListener(event, handler, { signal, ...options });
	};
}

// Async handlers:
export function sink_replace(iterator) {
	return async (part_list, index, signal) => {
		let derived, cancel;
		for await (const expr of iterator) {
			if (signal.aborted) break;
			if (cancel) cancel();

			[derived, cancel] = derive_signal(signal);

			apply_expression_part(expr, part_list, index, derived);
		}
	};
}
export function sink_append(iterator) {
	return async (part_list, index, signal) => {

		for await (const expr of iterator) {
			if (signal.aborted) break;

			apply_expression_part(expr, part_list, part_list.refs.length, signal);
		}
	};
}
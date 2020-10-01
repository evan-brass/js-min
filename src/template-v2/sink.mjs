import apply_expression from "./apply-expression.mjs";

export default function sink_append(ai) {
	return async (target, signal) => {
		let derived;
		for await (const val of ai) {
			if (signal.aborted) break;

			if (derived) derived.abort();
			derived = new AbortController();
			signal.addEventListener(() => derived.abort());

			const temp = new Comment();
			target.before(temp);

			apply_expression(val, temp, derived.signal);
		}
	};
}
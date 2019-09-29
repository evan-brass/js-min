import abortError from '../cancellation/abort-error.mjs';

export default function delay(ms, signal = undefined) {
	return new Promise((resolve, reject) => {
		const handle = setTimeout(resolve, ms);
		// TODO: extract the if (signal !== undefined) {signal.addEventListener('abort', /*  CODE */)} into a helper method.
		if (signal !== undefined) {
			signal.addEventListener('abort', _ => {
				clearTimeout(handle);
				reject(abortError());
			});
		}
	});
}
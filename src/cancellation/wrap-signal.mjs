export default function wrapSignal(signal) {
	const signalPromise = new Promise((_, reject) => {
		signal.addEventListener('abort', _ => {
			reject(new DOMException('Signal was aborted', 'AbortError'));
		});
	});
	return function wrap(promise) {
		if (signal.aborted) {
			return signalPromise;
		} else {
			return Promise.race([signalPromise, promise]);
		}
	};
}
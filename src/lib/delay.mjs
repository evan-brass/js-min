export default function delay(ms, abortSignal = false) {
	return new Promise((resolve, reject) => {
		const handle = setTimeout(resolve, ms);
		if (abortSignal) {
			abortSignal.addEventListener('abort', _ => {
				clearTimeout(handle);
				reject(new DOMException('Signal Aborted.', 'AbortError'));
			});
		}
	});
}
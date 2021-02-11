export default function delay(ms, signal = false) {
	return new Promise((resolve, reject) => {
		const handle = setTimeout(resolve, ms);
		if (signal) {
			signal.addEventListener('abort', () => {
				clearTimeout(handle);
				reject(new Error("Operation Aborted."));
			});
		}
	});
}
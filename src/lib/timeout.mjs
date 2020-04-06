export default function timeout(time_limit, signal = false) {
	const controller = new AbortController();
	function abort() {
		controller.abort();
	}
	if (signal) {
		signal.addEventListener('abort', abort);
	}
	setTimeout(abort, time_limit);
	return controller.signal;
}
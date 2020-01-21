// @flow

export default function abortError() {
	// TODO: Decide upon a uniform message for abort errors
	return new DOMException('Signal Aborted.', 'AbortError')
	// return new DOMException('Operation Aborted.', 'AbortError');
	// return new DOMException('User aborted.', 'AbortError');
}
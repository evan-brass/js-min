// @flow

import AbortError from './abort-error.mjs';

// TODO: Add reference counting / something to automatically abort an operation if it is no longer needed.

export default function wrapSignal(signal/*:AbortSignal*/) {
	// This promise will never resolve.
	const signalPromise/*:Promise<void>*/ = new Promise((_resolve, reject) => {
		signal.addEventListener('abort', reject.bind(null, AbortError()));
	});
	return function wrap/*flow-include <T>*/(promise/*: Promise<T>*/)/*:Promise<T>*/ {
		// Safe to cast because signalPromise will never resolve.
		const castedSignalPromise = /*flow-include ((*/signalPromise/*: any): Promise<T>)*/
		if (signal.aborted) {
			return castedSignalPromise;
		} else {
			return Promise.race([castedSignalPromise, promise]);
		}
	};
}
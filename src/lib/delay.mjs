// @flow

import wrapSignal from '../cancellation/wrap-signal.mjs';

export default function delay(ms/*:number*/, signal/*:?AbortSignal*/)/*:Promise<void>*/ {
	let handle;
	let prom/*:Promise<void>*/ = new Promise(resolve => {
		handle = setTimeout(resolve, ms);
	});
	if (signal) {
		const wrap = wrapSignal(signal);
		prom = wrap(prom);
	}
	prom.finally(_ => clearTimeout(handle));
	return prom;
}
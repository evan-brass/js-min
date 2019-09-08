import Differed from './differed.mjs'; 

// TODO: Make cancellation into a trait.
// TODO: Add reference counting / something to share promises and allow independent cancellation.

class CancelationError extends Error {
	constructor() {
		super("The operation was cancelled.");
	}
}

// Eat unhandled rejection errors if they were caused by a CancelationError.  Should still propagate though if you wanted to handle it still.
window.addEventListener("unhandledrejection", event => {
	const {reason} = event;
	if (reason instanceof CancelationError) {
		// console.log('Uncaught Cancellation: ', reason);
		event.preventDefault();
	}
});

function fasync(func) {
	const cancelToken = new Differed();
	const fawait = promise => {
		const ret = Promise.race([cancelToken, promise]);
		const cancelChild = _ => promise.cancel && promise.cancel();
		ret.then(cancelChild, cancelChild);
		return ret;
	};
	return (...args) => {
		const prom = Promise.race([cancelToken, func(fawait, ...args)]);
		prom.cancel = () => {
			cancelToken.reject(new CancelationError());
		};
		return prom;
	};
}
const [frace, fall, fany, fallSettled] = ['race', 'all', 'any', 'allSettled'].map(
	func => fasync(async function(fawait, ...inputs) {
		try {
			return await fawait(Promise[func](inputs));
		} finally {
			inputs.forEach(prom => prom.cancel && prom.cancel());
		}
	})
);
function fasyncg(ag) {
	const cancelTokens = [];
	const fawait = promise => {
		const ret = Promise.race([cancelTokens[0], promise]);
		const cancelChild = _ => promise.cancel && promise.cancel();
		ret.then(cancelChild, cancelChild);
		return ret;
	};
	const generator = function *(...args) {
		try {
			for (const agpromise of ag(fawait, ...args)) {
				const cancelToken = new Differed();
				cancelTokens.push(cancelToken);
				const prom = Promise.race([cancelToken, agpromise]);
				const advanceCancelationTokens = _ => cancelTokens.unshift();
				agpromise.then(advanceCancelationTokens, advanceCancelationTokens);
				prom.cancel = () => {
					cancelToken.reject(new CancelationError());
				};
				yield prom;
			}
		} finally {
			// Cancel any outstanding requests after a return.
			for (const token of cancelTokens) {
				token.reject(new CancelationError());
			}
		}
	};
	generator[Symbol.asyncIterator] = generator;
	generator[Symbol.iterator] = undefined;
	return generator;
}

export {fasync, CancelationError, frace, fall, fany, fallSettled, fasyncg};
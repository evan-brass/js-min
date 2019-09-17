import Differed from './differed.mjs'; 

// TODO: Make cancellation into a trait.
// TODO: Add reference counting / something to share promises and allow independent cancellation.

export class CancellationError extends Error {
	constructor() {
		super("The operation was cancelled.");
	}
}

// Eat unhandled rejection errors if they were caused by a CancellationError.  Should still propagate though if you wanted to handle it still.
window.addEventListener("unhandledrejection", ({reason, preventDefault}) => {
	if (reason instanceof CancellationError) {
		// console.log('Uncaught Cancellation: ', reason);
		preventDefault();
	}
});

export default class CancelToken {
	// Inherit from a AbortSignal or Abort Controller?

	// TODO: Make private when Canary implements it
	differed = new Differed();

	// Wrap an async function passing a cancellation token in as an argument.
	static cancelableAsync(asyncFunction) {
		return (...args) => {
			const token = new CancelToken();
			const promise = token.wrap(asyncFunction(token, ...args));
			promise.cancel = token.cancel.bind(token);
			return promise;
		};
	}
	// Wrap an async generator so that it can handle cancellations of individual promises
	static cancelableAsyncGen(asyncGeneratorFunction) {
		return (...args) => {
			const cancelToken = new CancelToken();
			let lastPromise;
			const ai = asyncGeneratorFunction(cancelToken, ...args);
			return {
				_common(funcName, input) {
					const newToken = new CancelToken();

					const advanceToken = _ => cancelToken.replaceWith(newToken); 
					if (lastPromise) lastPromise.finally(advanceToken);
					else advanceToken();

					lastPromise = ai[funcName](input);
					const promise = newToken.wrap.call(lastPromise);
					promise.cancel = newToken.cancel.bind(newToken);
					return promise;
				},
				next(input) {
					return this._common('next', input);
				},
				throw(input) {
					return this._common('throw', input);
				},
				return(input) {
					return this._common('return', input);
				},
				[Symbol.asyncIterator]() { return this; }
			};
		};
	}

	cancel() {
		this.differed.reject(new CancellationError());
	}

	// This is used so that a asyncGenerator can have a single reference to a cancelToken but have it be replaced for each individual item.
	replaceWith(cancelToken) {
		this.differed = cancelToken.differed;
	}

	wrap(promise) {
		const ret = Promise.race([this.differed, promise]);
		ret.cancel = _ => promise.cancel && promise.cancel();
		ret.then(ret.cancel, ret.cancel);
		return ret;
	}
	// Quiet returns undefined on cancellation.  This is useful if you don't intend to use the result and the promise is only for notification / synchronization.  It can remove a try catch in some cases.  Perhaps waiting until canceled to do something, etc.
	async wrap_quiet(promise) {
		try {
			return this.wrap(promise);
		} catch(err) {
			if (err instanceof CancellationError) {
				return;
			} else {
				throw err;
			}
		}
	}
	wrapAI(asyncIteration) {
		// Unfortunately, just using a for loop wouldn't capture and pass along any data passed in using .next, .throw, or .return so I have to use this stuff.
		const ai = asyncIteration[Symbol.asyncIterator]();
		const token = this;

		return {
			_common(funcName, input) {
				const promise = ai[funcName](input);
				return token.wrap(promise);
			},
			next(input) {
				return this._common('next', input);
			},
			throw(input) {
				return this._common('throw', input);
			},
			return(input) {
				return this._common('return', input);
			},
			[Symbol.asyncIterator]() { return this; }
		};
	}

	// MAYBE: Do we need to be able to derive a new cancelToken from an existing token?

	// TODO: Make private when Canary implements it
	_multiHelper(funcName, promises) {
		const prom = Promise[funcName](promises);
		prom.cancel = promises.forEach(
			prom => prom.cancel && prom.cancel()
		);
		return this.wrap(prom);
	}
	wrapRace(promises) {
		return this._multiHelper('race', promises);
	}
	wrapAll(promises) {
		return this._multiHelper('all', promises);
	}
	wrapAny(promises) {
		return this._multiHelper('any', promises);
	}
	wrapAllSettled(promises) {
		return this._multiHelper('allSettled', promises);
	}
}
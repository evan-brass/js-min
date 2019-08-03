import Differed from './lib/differed.mjs';

// TODO: Make a conceptual replacement for an async generator.

export default class Future extends Promise {
	constructor(iteration) {
		super(_ => true);
		this._instance = iteration;
		this._result = new Differed();
		this._downStreamFutures = [];
		this.handle(this._instance.next());
	}
	handle(localStep) {
		this._step = localStep;
		this._downStreamFutures.forEach(fut => fut.cancel());
		this._downStreamFutures.length = 0;
		const {value, done} = localStep;
		if (done) {
			this._result.resolve(value)
		} else {
			if (value instanceof Future) {
				this._downStreamFutures.push(value);
			}
			if (value.then) {
				value.then(value => {
					if (localStep == this._step) {
						this.handle(this._instance.next(value));
					} else {
						// Same as below: This happens when someone has touched the iteration since we started awaiting this promise.  In that case, our value is stale and we should just ignore it.
					}
				}, err => {
					if (localStep == this._step) {
						this.handle(this._instance.throw(err));
					} else {
						// Same as above: This happens when someone has touched the iteration since we started awaiting this promise.  In that case, our value is stale and we should just ignore it.
					}
				});
			} else {
				throw new Error("Future doesn't currently handle any other values than promises and futures.");
			}
		}
	}
	cancel() {
		this.handle(this._instance.return());
	}
	// TODO: override the promise combinators to propagate cancellation / return a future instead of a promise.
	static any(futures) {
	}
	static all(futures) {
		return new Future((function*() {
			try {
				return yield Promise.all(futures);
			} finally {
				futures.forEach(fut => fut.cancel());
			}
		})());
	}
	static race(futures) {
		return new Future((function*() {
			try {
				return yield Promise.race(futures);
			} finally {
				futures.forEach(fut => fut.cancel());
			}
		})());
	}
	then(callback, errCallback) {
		return this._result.then(callback, errCallback);
	}
}
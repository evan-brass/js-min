// This doesn't actually conform to the promise spec.  The then method doesn't return a promise.  But it works for my use cases.  It's awaitable which is all I care about mostly.
export default class Differed {
	constructor() {
		this._promise = new Promise((resolve, reject) => {
			this.resolve = resolve;
			this.reject = reject;
		});
	}
	then(...args) {
		return this._promise.then(...args);
	}
}
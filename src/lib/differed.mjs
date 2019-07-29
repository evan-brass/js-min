// This doesn't actually conform to the promise spec.  The then method doesn't return a promise.  But it works for my use cases.  It's awaitable which is all I care about mostly.
export default class Differed {
	constructor() {
		this._callbacks = [];
		this._err_callbacks = [];
	}
	resolve(value) {
		for (const func of this._callbacks) {
			func(value);
		}
		this._callbacks.length = 0;
		this._err_callbacks.length = 0;
	}
	reject(value) {
		for (const func of this._err_callbacks) {
			func(value);
		}
		this._callbacks.length = 0;
		this._err_callbacks.length = 0;
	}
	then(callback, err_callback) {
		if (typeof callback === 'function')
			this._callbacks.push(callback);
		if (typeof err_callback === 'function')
			this._err_callbacks.push(err_callback);
	}
}
// @flow

import differed from "./differed.mjs";

/*::
type Action<T> = {
	type: 'yield' | 'return',
	val: T
} | {
	type: 'throw',
	val: any
}
*/

export default class Subject/*:: <T>*/ {
	/*::
	differed: {
		promise: Promise<Action<T>>,
		resolve: (arg: Action<T>) => void
	};*/
	constructor() {
		this.differed = differed();
	}
	yield(val/*:T*/) {
		this.differed.resolve({type: 'yield', val});
	}
	return(val/*:T*/) {
		this.differed.resolve({type: 'return', val});
	}
	throw(val/*:any*/) {
		this.differed.resolve({type: 'throw', val});
	}
	// $FlowFixMe
	async *[Symbol.asyncIterator]()/*:AsyncIterator<T>*/ {
		while (true) {
			const {type, val} = await this.differed;
			this.differed = new Differed();
			switch(type) {
				case 'yield':
					try {
						this.lastNext = yield val;
					} catch(err) {
						this.lastError = err;
					}
					break;
				case 'return':
					return val;
				case 'throw':
					throw val;
				default:
					throw new Error("Unknown type");
			}
		}
	}
	/*:: 
	@@asyncIterator(): AsyncIterator<T> {
		// $FlowFixMe
		return this[Symbol.asyncIterator];
	}
	*/

}
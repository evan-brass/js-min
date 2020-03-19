import differed from "./differed.mjs";

export default class Subject {
	constructor() {
		this.differed = new differed();
	}
	yield(val) {
		this.differed.res({type: 'yield', val});
	}
	return(val) {
		this.differed.res({type: 'return', val});
	}
	throw(val) {
		this.differed.res({type: 'throw', val});
	}
	async *[Symbol.asyncIterator]() {
		while (true) {
			const {type, val} = await this.differed;
			this.differed = new differed();
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
}
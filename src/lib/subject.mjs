import Differed from "./differed.mjs";

export default class Subject {
	constructor() {
		this.differed = new Differed();
	}
	yield(val) {
		this.differed.resolve({type: 'yield', val});
	}
	return(val) {
		this.differed.resolve({type: 'return', val});
	}
	throw(val) {
		this.differed.resolve({type: 'throw', val});
	}
	async *[Symbol.asyncIterator]() {
		while (true) {
			const {type, val} = await this.differed;
			switch(type) {
				case 'yield':
					yield val;
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
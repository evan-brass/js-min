export default class ComputedValue {
	constructor(evaluate, sources = []) {
		this.evaluate = evaluate;
		this.sources = sources;
		this.valid = false;
	}
	async then(callback) {
		const never = new Promise(_ => {});
		if (!this.promises) {
			this.promises = this.sources.map((value, i) => value.next().then(({value, done}) => {

			}));
		}
		if (!this.values) {
			this.values = Promise.all(this.promises);
		}
		const values = await this.values;
	}
	async *[Symbol.asyncIterator]() {
		while (true) {

		}
	}
}
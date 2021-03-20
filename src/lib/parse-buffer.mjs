export default class ParseBuffer {
	constructor(input = "") {
		this.unparsed = input;
	}
	match = false
	pull(regex) {
		const res = regex.exec(this.unparsed);
		if (res !== null) {
			const [full_match, ...captures] = res;
			this.unparsed = this.unparsed.substr(full_match.length);
			this.match = captures;
			return true;
		} else {
			this.match = false;
			return false;
		}
	}
}
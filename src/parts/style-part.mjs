import Part from './part.mjs';

export default class StylePart extends Part {
	constructor(element, stylesheet, shared, index) {
		super('style', element);
		this.stylesheet = stylesheet;
		this.shared = shared;
		this.index = index;
	}
    update(newValue) {
        this.shared[this.index] = newValue;
        this.stylesheet.replace(this.shared.join(''));
    }
    clear() {
        this.update('');
    }
}
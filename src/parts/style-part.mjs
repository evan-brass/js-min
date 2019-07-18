import Part from './part.mjs';

export default class StylePart extends Part {
	constructor(element, stylesheet, shared, index) {
		super('style-part', element);
		this.stylesheet = stylesheet;
		this.sharedIndex = shared;
		this.index = index;
	}
    update(newValue) {
        this.shared[this.sharedIndex] = newValue;
        this.stylesheet.replace(this.shared.join(''));
    }
    clear() {
        this.update('');
    }
}
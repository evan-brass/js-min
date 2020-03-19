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
		if (this.stylesheet instanceof CSSStyleSheet) {
			this.stylesheet.replace(this.shared.join(''));
		} else {
			this.stylesheet.innerText = this.shared.join('');
		}
    }
    clear() {
        this.update('');
    }
}
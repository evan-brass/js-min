import Part from './part.mjs';

export default class AttributeValuePart extends Part {
	constructor(element, attribute_name, shared, shared_index) {
		super('attribute-value', element);
		this.attribute_name = attribute_name;
		this.shared = shared;
		this.shared_index = shared_index;
	}
	update(newValue) {
		this.shared[this.shared_index] = newValue;
		this.element.setAttribute(this.attribute_name, this.shared.join(''));
	}
	clear() {
		this.update('');
	}
}
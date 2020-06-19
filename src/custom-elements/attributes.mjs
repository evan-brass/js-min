import differed from '../lib/differed.mjs';

// TODO: this.attribute_change_queue and this.attribute_changed should be private
export default function attributes(inherit) {
	return class Attributes extends inherit {
		constructor() {
			super();

			this.attribute_change_queue = [];
			const self = this;
			this.attributeChanges = {
				async *[Symbol.asyncIterator]() {
					while (true) {
						if (self.attribute_change_queue.length == 0) {
							self.attribute_changed = differed();
							await self.attribute_changed;
							self.attribute_changed = false;
						}
						yield self.attribute_change_queue.shift();
					}
				}
			};
		}
		attributeChangedCallback(key, oldValue, newValue) {
			this.attribute_change_queue.push([key, oldValue, newValue]);
			if (this.attribute_changed) {
				this.attribute_changed.res();
			}
		}
		static get observedAttributes() { return []; }
	};
}
function _clean(first, last) {
	if (first === last) {
		first.remove();
		return first;
	} else {
		const frag = new DocumentFragment();

		while (first != last) {
			const temp = first;
			first = first.nextSibling;
			frag.appendChild(temp);
		}
		frag.appendChild(last);
		return frag;
	}
}

export default class PartList {
	refs = []
	parent = null
	first = null
	constructor(parentOrComment) {
		if (parentOrComment instanceof Comment) {
			this.first = parentOrComment;
		} else {
			this.parent = parentOrComment;
		}
	}
	_indexOrRef(indexOrRef) {
		if (Number.isInteger(indexOrRef)) {
			return [indexOrRef, this.refs[indexOrRef]];
		} else {
			index = this.refs.indexOf(ref);
			if (index === -1) throw new Error("The ref doesn't belong to this list.");
			return [index, indexOrRef];
		}
	}
	splice(ior, remove_count, ...new_items) {
		let index = this._indexOrRef(ior)[0];

		// To slice we iterate from index -> max(remove_count, new_items.length)
		// There's three cases: removing, replacing, and inserting.
		// We replace from index -> index + min(remove_count, new_items.length)
		// If remove_count > new_items.length then we remove the rest
		// if new_items.length > remove_count then we insert the rest

		const frags = [];

		let end = index + Math.max(remove_count, new_items.length);
		let remove_end = index + remove_count;
		for (; index < end; ++index) {
			// Get the ref if we're going to be removing / replacing
			const ref = (index < remove_end) ? this.refs[index] : undefined;

			// Get the content if we're going to be replacing / inserting (make sure it's a node)
			let new_content = new_items.shift();
			if (new_content !== undefined && !(new_content instanceof Node)) {
				new_content = new Text(new_content.toString());
			}

			// 1) Insert new content (if any)
			if (new_content) {
				const new_ref = {
					last: (new_content instanceof DocumentFragment) ? new_content.lastChild : new_content
				};
				const new_first = (new_content instanceof DocumentFragment) ? new_content.firstChild : new_content;
				if (this.refs.length === 0) {
					if (this.first) {
						this.first.replaceWith(new_content);
					} else if (this.parent) {
						this.parent.appendChild(new_content);
					} else {
						throw new Error("This list is unattached - meaning it doesn't know where to put it's first part into the DOM.  It should either have a `this.first` or a `this.parent`.");
					}
				} else {
					if (index == 0) {
						this.first.before(new_content);
					} else {
						this.refs[index - 1].last.after(new_content);
					}
				}
				if (index === 0) {
					this.first = new_first;
				}

				// Update the ref or insert a new one
				if (ref) {
					this.refs[index] = new_ref;
				} else {
					this.refs.splice(index, 0, new_ref);
				}
			}

			// 2) Remove old_content (if any)
			if (ref) {
				const first = (index === 0) ? this.first : this.refs[index - 1].last.nextSibling;
				if (!new_content) {
					// We are removing, not swapping:
					if (this.refs.length === 1) {
						// If removing last part, and there's no parent, insert a placeholder
						if (!this.parent) {
							this.first = new Comment();
							first.before(this.first);
						} else {
							this.first = null;
						}
					} else if (index === 0) {
						this.first = ref.last.nextSibling;
					}

					// Since we're removing, we need to replay the same index.
					--index; --end;
					this.refs.splice(index, 1);
				}
				frags.push(_clean(first, ref.last));
			}
		}

		// Return the old fragments
		// The new refs can be aquired using slice: this.list.slice(index, index + new_items.length)
		console.assert(frags.length == remove_count);
		return frags;
	}
}
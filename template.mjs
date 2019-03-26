export default class Template {
	static createId() {
		// TODO: Improve ID generation
		// Always start the id with an a so that it is valid everywhere.
		return 'a' + Math.floor(Math.random() * Date.now()).toString(16);
	}
	static get templateCache() {
		if (!this._templateCache) {
			this._templateCache = new Map();
		}
		return this._templateCache;
	}
	static getTemplate(strings) {
		if (!this.templateCache.has(strings)) {
			this.templateCache.set(strings, new Template(strings));
		}
		return this.templateCache.get(strings);
	}
	// TODO: Remove / make static most of these methods.  They shouldn't really be used externally.
	*markers() {
		for (let order = 0; true; ++order) {
			yield `${this.id}-${order}`;
		}
	}
	findMarker(string) {
		const markerFinder = new RegExp(`${this.id}-([0-9]+)`);
		const exec = markerFinder.exec(string);
		if (exec) {
			const [fullMatch, order] = exec;
			const before = string.slice(0, exec.index);
			const after = string.slice(exec.index + fullMatch.length);
			return [before, Number.parseInt(order), after];
		} else {
			return [string, -1, ""];
		}
	}
	joinStrings(strings) {
		let composed = "";
		const markers = this.markers();
		for (let i = 0; i < strings.length - 1; ++i) {
			const str = strings[i];
			composed += str + markers.next().value;
		}
		composed += strings[strings.length - 1];
		return composed;
	}
	createTemplate(innerHTML) {
		this.template = document.createElement('template');
		this.template.innerHTML = innerHTML;
	}
	convertMarkers() {
		this.template.content.normalize(); // Just in case...
		// Don't call normalize later because it would collapse the Text nodes that hold the location for node type parts
		const walker = document.createTreeWalker(
			this.template.content, 
			NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT
		);
		let nextNode = walker.nextNode();
		while (nextNode) {
			const node = walker.currentNode;
			if (node.nodeType == Node.ELEMENT_NODE) {
				const elementData = {
					shared: [],
					parts: []
				}
				for (const attrName of node.getAttributeNames()) {
					const [before, order, after] = this.findMarker(attrName);
					if (order != -1) {
						elementData.parts.push({
							type: "attribute",
							order
						});
						node.removeAttribute(attrName);
					} else {
						let value = node.getAttribute(attrName);
						let [before, order, after] = this.findMarker(value);
						let shared = false;
						while (order != -1) {
							if (!shared) {
								shared = [];
								elementData.shared.push(shared);
							}
							if (before != "") {
								shared.push(before);
							}
							value = after;
							elementData.parts.push({
								type: "attribute-value",
								order,
								attrName,
								index: shared.length,
								sharedIndex: elementData.shared.length - 1
							});
							shared.push(""); // String where this part's value goes
							[before, order, after] = this.findMarker(value);
						}
						if (value != '') {
							shared.push(value);
						}
						if (shared) {
							node.setAttribute(attrName, shared.join(''));
						}
					}
				}
				if (elementData.parts.length > 0) {
					node.parentNode.insertBefore(new Comment(JSON.stringify(elementData)), node);
				}
			} else if (node.nodeType == Node.TEXT_NODE) {
				const [before, order, after] = this.findMarker(node.data);
				if (order != -1) {
					const comment = new Comment(JSON.stringify({
						type: 'node',
						order
					}));
					const replaceWith = [];
					if (before != "") {
						node.parentNode.insertBefore(new Text(before), node);
					}
					node.parentNode.insertBefore(comment, node);
					if (after != "") {
						node.parentNode.insertBefore(new Text(after), node.nextSibling);
					}
					nextNode = walker.nextNode();
					node.remove();
					continue;
				}
			}
			nextNode = walker.nextNode();
		}
	}
	constructor(strings, node) {
		if (!node) {
			this.id = this.constructor.createId();
	
			const joinedStrings = this.joinStrings(strings);
	
			this.createTemplate(joinedStrings);
	
			this.convertMarkers();
		} else {
			this.template = node;
		}
		
		this.constructor.templateCache.set(strings, this);
	}

	instantiate() {
		return document.importNode(this.template.content, true);
	}
}
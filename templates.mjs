const templateCache = new Map();
export function getTemplate(litStrings) {
	if (templateCache.has(litStrings)) {
		return templateCache.get(litStrings);
	} else {
		const ID = Math.floor(Math.random() * Date.now()).toString(16);
		const markers = (function*() {
			for (let position = 0; true; ++position) {
				// always start with a letter
				yield `a${ID}-${position}`;
			}
		})();
		let composed = "";
		for (const str of litStrings) {
			composed += str + markers.next().value;
		}
		const templateEl = document.createElement('template');
		templateEl.innerHTML = composed;
		const markerFinder = new RegExp(`a${ID}-([0-9]+)`);
		function convertMarkers(node) {
			const foundMarkers = [];
			if (node.getAttributeNames) {
				for (const attrName of node.getAttributeNames()) {
					const exec = markerFinder.exec(attrName);
					if (exec) {
						const [_, pos] = exec;
						foundMarkers.push({
							type: "attribute",
							pos
						});
						node.removeAttribute(attrName);
					} else {
						let value = node.getAttribute(attrName);
						const shared = [];
						let exec = markerFinder.exec(value);
						while (exec) {
							const [fullMatch, pos] = exec;
							const before = value.slice(0, exec.index);
							if (before != "") {
								shared.push();
							}
							value = value.slice(exec.index + fullMatch.length);
							foundMarkers.push({
								type: "attribute-value",
								pos,
								attrName,
								sharedIndex: shared.length,
								shared
							});
							shared.push("");
							exec = markerFinder.exec(value);
						}
						if (value != '') {
							shared.push(value);
						}
					}
				}
			}
			if (foundMarkers.length > 0) {
				node.parentNode.insertBefore(new Comment(JSON.stringify(foundMarkers)), node);
			}
			let nextNode = node.firstChild;
			while (nextNode) {
				convertMarkers(nextNode);
				nextNode = nextNode.nextSibling;
			}
		}
		convertMarkers(templateEl.content);
		return templateEl;
	}
}

export function html(strings, ...expressions) {
	const template = getTemplate(strings);
	document.body.appendChild(template);
	console.log(template);
}
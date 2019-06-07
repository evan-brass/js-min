import hashString from "./lib/string-hash.mjs";

const TemplateCache = new Map();

const appendTemplates = document.createElement('template');
appendTemplates.id = "generated-templates";
document.body.appendChild(appendTemplates);

export function getTemplate(strings) {
	function createId(strings) {
		// Always start the id with a character so that it is valid everywhere in HTML.
		return 'a' + Math.abs(hashString(strings.join('{{}}'))).toString(16);
	}
	function joinStrings(strings, markers) {
		let composed = "";
		for (let i = 0; i < strings.length - 1; ++i) {
			const str = strings[i];
			composed += str + markers.next().value;
		}
		composed += strings[strings.length - 1];
		return composed;
	}
	function *markers(id) {
		for (let order = 0; true; ++order) {
			yield `${id}-${order}`;
		}
	}
	if (!(strings instanceof Array)) {
		throw new Error("Argument to createTemplate must be an Array of strings like that produced by a tagged template litteral.");
	}
	const id = createId(strings);
	if (TemplateCache.has(id)) {
		return TemplateCache.get(id);
	} else {
		const template = document.createElement('template');
		if (appendTemplates) {
			appendTemplates.appendChild(template);
		}
		template.id = id;
		template.innerHTML = joinStrings(strings, markers(id));
	
		convertMarkers(template, id);

		TemplateCache.set(id, template);
	
		return template;
	}
}

// TODO: Move convertMarkers to parts.mjs?
function convertMarkers(root, id) {
	function findMarker(id, string) {
		const markerFinder = new RegExp(`${id}-([0-9]+)`);
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
	root.content.normalize(); // Just in case...
	// Don't call normalize later because it would collapse the Text nodes that hold the location for node type parts (Shouldn't be a problem when we later switch away from using Text nodes to frame NodeParts)
	const walker = document.createTreeWalker(
		root.content, 
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
				const [before, order, after] = findMarker(id, attrName);
				if (order != -1) {
					elementData.parts.push({
						type: "attribute",
						order
					});
					node.removeAttribute(attrName);
				} else {
					let value = node.getAttribute(attrName);
					let [before, order, after] = findMarker(id, value);
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
						// I don't think that getting attributes is always in DOM string order
						elementData.parts.sort((a, b) => a.order - b.order);
						shared.push(""); // String where this part's value goes
						[before, order, after] = findMarker(id, value);
					}
					if (shared) {
						if (value != '') {
							shared.push(value);
						}
						node.setAttribute(attrName, shared.join(''));
					}
				}
			}
			if (elementData.shared.length == 0) {delete elementData.shared};
			if (elementData.parts.length > 0) {
				node.parentNode.insertBefore(new Comment(JSON.stringify(elementData)), node);
			}
		} else if (node.nodeType == Node.TEXT_NODE) {
			const [before, order, after] = findMarker(id, node.data);
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
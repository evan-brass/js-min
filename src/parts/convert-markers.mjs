// TODO: Need to include the id and frame NodeParts to support server side rendering where one template might have a template rendered within one of it's node parts.  I still don't know how that is going to be reported upward though...
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

function convertAttributeMarkers(node, id) {
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
}

export default function convertMarkers(root, id) {
	// The reason that we need to call normalize is because if a marker spanned accross a text node then we wouldn't find it because we check each text node individually.  Hypothetically, since we just created the template element then it should be normal, but to satisfy paranoia...
	root.content.normalize();
	// Don't call normalize later because it would collapse the Text nodes that hold the location for node type parts (Shouldn't be a problem when we later switch away from using Text nodes to always framed NodeParts).
	const walker = document.createTreeWalker(
		root.content, 
		NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT
	);
	let nextNode = walker.nextNode();
	while (nextNode) {
		const node = walker.currentNode;
		if (node.nodeType == Node.ELEMENT_NODE) {
			convertAttributeMarkers(node, id);
			if (node.nodeName == "STYLE") {
				console.warn(new Error("Please consider using the Stylesheet constructor or a pattern that will transition well to it eventually instead of using style tags: https://wicg.github.io/construct-stylesheets/"));
			}
		} else if (node.nodeType == Node.TEXT_NODE) {
			const [before, order, after] = findMarker(id, node.data);
			if (order != -1) {
				if (node.parentNode.nodeName == "STYLE") {
					throw new Error("Node parts aren't allowed within style tags because during parsing they don't allow DOM comments inside which means they couldn't be sent in a precompiled template.");
				}
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
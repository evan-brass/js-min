// TODO: Need to include the id and frame NodeParts to support server side rendering where one template might have a template rendered within one of it's node parts.  I still don't know how that is going to be reported upward though...
function find_marker(id, string) {
	const marker_finder = new RegExp(`${id}-([0-9]+)`);
	const exec = marker_finder.exec(string);
	if (exec) {
		const [full_match, order] = exec;
		const before = string.slice(0, exec.index);
		const after = string.slice(exec.index + full_match.length);
		return [before, Number.parseInt(order), after];
	} else {
		return [string, -1, ""];
	}
}

function convert_attribute_markers(node, id) {
	const element_data = {
		shared: [],
		parts: []
	}
	for (const attribute_name of node.getAttributeNames()) {
		const [_before, order, _after] = find_marker(id, attribute_name);
		if (order != -1) {
			element_data.parts.push({
				type: "attribute",
				order
			});
			node.removeAttribute(attribute_name);
		} else {
			let value = node.getAttribute(attribute_name);
			let [before, order, after] = find_marker(id, value);
			let shared = false;
			while (order != -1) {
				if (!shared) {
					shared = [];
					element_data.shared.push(shared);
				}
				if (before != "") {
					shared.push(before);
				}
				value = after;
				element_data.parts.push({
					type: "attribute-value",
					order,
					attrName: attribute_name,
					index: shared.length,
					sharedIndex: element_data.shared.length - 1
				});
				// I don't think that getting attributes is always in DOM string order
				element_data.parts.sort((a, b) => a.order - b.order);
				shared.push(""); // String where this part's value goes
				[before, order, after] = find_marker(id, value);
			}
			if (shared) {
				if (value != '') {
					shared.push(value);
				}
				node.setAttribute(attribute_name, shared.join(''));
			}
		}
	}
	if (element_data.shared.length == 0) {delete element_data.shared};
	if (element_data.parts.length > 0) {
		node.parentNode.insertBefore(new Comment(JSON.stringify(element_data)), node);
	}
}

export default function convert_markers(root, id) {
	// The reason that we need to call normalize is because if a marker spanned accross a text node then we wouldn't find it because we check each text node individually.  Hypothetically, since we just created the template element then it should be normal, but to satisfy paranoia...
	root.content.normalize();
	// Don't call normalize later because it would collapse the Text nodes that hold the location for node type parts (Shouldn't be a problem when we later switch away from using Text nodes to always framed NodeParts using comment nodes - The reason for switching to framed + comments is for server side rendering and rehydration).
	const walker = document.createTreeWalker(
		root.content, 
		NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT
	);
	let next_node = walker.nextNode();
	while (next_node) {
		const node = walker.currentNode;
		if (node.nodeType == Node.ELEMENT_NODE) {
			convert_attribute_markers(node, id);
			if (node.nodeName == "STYLE") {
				console.warn(new Error("Please consider using the Stylesheet constructor or a pattern that will transition well to it eventually instead of using style tags: https://wicg.github.io/construct-stylesheets/"));
			}
		} else if (node.nodeType == Node.TEXT_NODE) {
			const [before, order, after] = find_marker(id, node.data);
			if (order != -1) {
				if (node.parentNode.nodeName == "STYLE") {
					throw new Error("Node parts aren't allowed within style tags because during parsing they don't allow DOM comments inside which means they couldn't be sent in a precompiled template.");
				}
				const comment = new Comment(JSON.stringify({
					type: 'node',
					order
				}));
				if (before != "") {
					node.parentNode.insertBefore(new Text(before), node);
				}
				node.parentNode.insertBefore(comment, node);
				if (after != "") {
					node.parentNode.insertBefore(new Text(after), node.nextSibling);
				}
				next_node = walker.nextNode();
				node.remove();
				continue;
			}
		}
		next_node = walker.nextNode();
	}
}
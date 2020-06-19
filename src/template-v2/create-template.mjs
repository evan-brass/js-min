// We can remove the asyncronous sha-1 hash with a 17-character random string that's only generated once.
const marker_base = crypto.getRandomValues(new Uint8Array(8)).reduce((str, n) => str + n.toString(16).padStart(2, '0'), 'a');
const marker_finder = new RegExp(`${marker_base}-([0-9]+)`);

function find_marker(string) {
	const exec = marker_finder.exec(string);
	if (exec) {
		const [full_match, order] = exec;
		const before = string.slice(0, exec.index);
		const after = string.slice(exec.index + full_match.length);
		return [before, Number.parseInt(order), after];
	} else {
		return [string, -1, ''];
	}
}

export default function create_template(strings) {
	// Create a template element with the markers:
	let order = 0;
	let template_contents = strings[0];
	for (let i = 1; i < strings.length; ++i) {
		template_contents += `${marker_base}-${order++}`;
		template_contents += strings[i];
	}
	const template = document.createElement('template');
	template.innerHTML = template_contents;

	// Convert the markers within that template element:
	let root = template.content;
	root.normalize();
	const walker = document.createTreeWalker(
		root,
		NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT
	);
	let next_node = walker.nextNode();
	while (next_node) {
		const node = walker.currentNode;
		if (node.nodeType == Node.ELEMENT_NODE) {
			const element_parts = [];
			for (const attribute_name of node.getAttributeNames()) {
				const [_before, i, _after] = find_marker(attribute_name);
				if (i != -1) {
					element_parts.push({ i });
					node.removeAttribute(attribute_name);
				} else {
					// No longer support attribute value parts.
				}
			}
			if (element_parts.length > 0) {
				node.parentNode.insertBefore(new Comment(JSON.stringify(element_parts)), node);
			}
		} else if (node.nodeType == Node.TEXT_NODE) {
			const [before, i, after] = find_marker(node.data);
			if (i != -1) {
				if (node.parentNode.nodeName == 'STYLE') {
					throw new Error("Node parts aren't allowed within style tags because during parsing they don't allow DOM comments inside which means they couldn't be sent in a precompiled template.");
				}
				const comment = new Comment(JSON.stringify({ i }));
				if (before != '') {
					node.parentNode.insertBefore(new Text(before), node);
				}
				node.parentNode.insertBefore(comment, node);
				if (after != '') {
					node.parentNode.insertBefore(new Text(after), node.nextSibling);
				}
				next_node = walker.nextNode();
				node.remove();
				continue;
			}
		}
		next_node = walker.nextNode();
	}

	return template;
}
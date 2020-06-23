export default function instantiate_template(template_el, handler = (_index, _target_node, _part_kind) => undefined) {
	const instance = document.importNode(template_el.content, true);

	// Connect the expressions to the instance
	const walker = document.createTreeWalker(instance, NodeFilter.SHOW_COMMENT);
	let node = walker.nextNode();
	while (node) {
		const comment_node = node;
		node = walker.nextNode();
		let parsed;
		try {
			// MAYBE: Maybe find a better way of determining if it's JSON or not.
			parsed = JSON.parse(comment_node.data);
		} catch (e) {
			// If the Comment's data isn't JSON parsable, then it's not ours.
			if (e instanceof SyntaxError) continue;
			// MAYBE: Check the syntax error to make sure that it's due to the contents not being JSON, and not some other SyntaxError.
			// If it's something other than a Syntax Error then don't catch it.
			else throw e;
		}
		// TODO: Handle if the comment's data is JSON but not one of out markers.
		if (parsed.length) {
			for (const { i } of parsed) {
				const target = comment_node.nextElementSibling;
				handler(i, target, 'attribute');
			}
			comment_node.remove()
		} else {
			handler(parsed.i, comment_node, 'node');
		}
	}

	return instance;
}
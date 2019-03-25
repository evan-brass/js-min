const templateCache = new Map();


function createTemplate(strings) {
	const ID = Math.floor(Math.random() * Date.now()).toString(16);
	const markers = (function*() {
		for (let position = 0; true; ++position) {
			// always start with a letter
			yield `a${ID}-${position}`;
		}
	})();
	let composed = "";
	for (let i = 0; i < strings.length - 1; ++i) {
		const str = strings[i];
		composed += str + markers.next().value;
	}
	composed += strings[strings.length - 1];
	const templateEl = document.createElement('template');
	templateEl.innerHTML = composed;
	const markerFinder = new RegExp(`a${ID}-([0-9]+)`);
	function testString(string) {
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
	function convertMarkers(node) {
		// console.log(node);
		if (node.nodeType == Node.ELEMENT_NODE) {
			const elementData = {
				shared: [],
				parts: []
			}
			for (const attrName of node.getAttributeNames()) {
				const [before, order, after] = testString(attrName);
				if (order != -1) {
					elementData.parts.push({
						type: "attribute",
						order
					});
					node.removeAttribute(attrName);
				} else {
					let value = node.getAttribute(attrName);
					let [before, order, after] = testString(value);
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
						[before, order, after] = testString(value);
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
			const [before, order, after] = testString(node.data);
			if (order != -1) {
				const comment = new Comment(JSON.stringify({
					type: 'node',
					order
				}));
				const replaceWith = [];
				if (before != "") {
					replaceWith.push(new Text(before));
				}
				replaceWith.push(comment);
				if (after != "") {
					replaceWith.push(new Text(after));
				}
				node.replaceWith(...replaceWith);
				return comment;
			}
		}
	}
	templateEl.content.normalize(); // Just in case...
	const walker = document.createTreeWalker(templateEl.content, NodeFilter.SHOW_TEXT | NodeFilter.SHOW_ELEMENT);
	while (walker.nextNode()) {
		// Not sure how this will behave with the text replace with
		convertMarkers(walker.currentNode);
	}
	convertMarkers(templateEl.content);
	templateCache.set(strings, templateEl);
}

function getComments(node) {
	const walker = document.createTreeWalker(node, NodeFilter.SHOW_COMMENT);
	const comments = [];
	while(walker.nextNode()) comments.push(walker.currentNode);
	return comments;
}

function parseTemplate(root) {
	const parts = getComments(root);
	for (let i = 0; i < parts.length; ++i) {
		const comment = parts[i];
		let result;
		try {
			result = JSON.parse(comment.data);
		} catch(e) {
			if (e instanceof SyntaxError) {
				parts.splice(i, 1);
				i -= 1;
			}
		}
		if (result) {
			if (result.type == undefined) {
				result.parts.forEach(part => {
					if (part.sharedIndex != undefined) {
						part.shared = result.shared[part.sharedIndex];
						delete part.sharedIndex;
					}
					part.el = comment.nextElementSibling;
				});
				parts.splice(i, 1, ...(result.parts));
				i += result.parts.length - 1;
				comment.remove();
			} else {
				result.el = new Text();
				comment.replaceWith(result.el);
				parts[i] = result;
			}
		}
	}
	parts.sort((a, b) => a.order - b.order);
	return parts
}

export function getTemplate(strings) {
	if (!templateCache.has(strings)) {
		createTemplate(strings);
	}
	const template = templateCache.get(strings);
	const frag = document.importNode(template.content, true);
	const parts = parseTemplate(frag);
	return [frag, parts];
}

export function html(strings, ...expressions) {
	const [template, parts] = getTemplate(strings);
	document.body.appendChild(template);
	console.log(template, parts);
	
}
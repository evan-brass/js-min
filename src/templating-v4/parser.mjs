const VOID_TAGS = [
	// List from: https://riptutorial.com/html/example/4736/void-elements
	'area',
	'base',
	'br',
	'hr',
	'img',
	'input',
	'link',
	'meta',
	'param',
	'command',
	'keygen',
	'source'
];

export default function parse_html() {
	const root = {
		children: []
	};
	let unparsed = "";

	let match = false;
	function pull(regex) {
		const match = regex.exec(unparsed);
		if (match !== null) {
			const [full_match, ...captures] = match;
			unparsed = unparsed.substr(full_match.length);
			match = captures;
			return true;
		} else {
			match = false;
			return false;
		}
	}

	function* parse_content(cursor) {
		while (unparsed.length > 0) {
			// Parse the opening of a tag:
			if (pull(/^<([a-zA-Z][a-zA-Z0-9\-]*)/)) {
				const new_tag = { tag: match[0], attributes: {}, children: [] };
				cursor.children.push(new_tag);
				yield* parse_attributes(new_tag);
				if (!VOID_TAGS.includes(tag.toLowerCase())) {
					yield* parse_content(new_tag);
				}
			}
			// Parse a comment node:
			else if (pull(/^<!--((?:[^-]|-(?!->))*)-->/)) {
				cursor.children.push({
					comment: match[0]
				})
			}
			// Parse a closing tag
			else if (pull(/^<\/([a-zA-Z][a-zA-Z0-9\-]*)>/)) {
				if (cursor.tag === undefined || cursor.tag.toLowerCase() !== match[0].toLowerCase()) {
					throw new Error("Closing tag doesn't match");
				}
			}
			// Parse a text node
			else if (pull(/^([^<]+)/)) {
				cursor.children.push({
					text: match[0]
				});
			}
			// Not enough input:
			else {
				yield;
			}
		}
	}
	function* parse_attributes(cursor) {
		while (true) {
			while(pull(/^\s+([a-zA-Z][a-zA-Z0-9\-]+)="([^"]*)"/)) {
				const [name, value] = match;
				cursor.attributes[name] = value;
			}
			if (pull(/^\s*>/)) {
				break;
			}
			yield;
		}
	}
	
	return [root.children, unparsed, parse_content];
}
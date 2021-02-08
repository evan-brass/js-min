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


/**
 * This is an interruptable ~html parser.  Its purpose is to extract information about the resulting DOM from HTML template literals.
 * Using it, we can get references to individual elements by tracing the "decendent path" or child indexes from the root of the template
 * to the element that we care about.  Doing it this way doesn't require a full dom traversal for a search or any ids / classes.
 */
export default function parse_html() {
	let unparsed = "";
	
	let match = false;
	function pull(regex) {
		const res = regex.exec(unparsed);
		if (res !== null) {
			const [full_match, ...captures] = res;
			unparsed = unparsed.substr(full_match.length);
			match = captures;
			return true;
		} else {
			match = false;
			return false;
		}
	}

	const stack = [];
	function get_top() {
		return stack[stack.length - 1];
	}

	function* parse_attributes() {
		let any_consumed = false;
		while (true) {
			// Pull an attribute name
			if (pull(/^\s+([a-zA-Z][a-zA-Z0-9\-]*)/)) {
				any_consumed = true;
				const attribute = {
					attribute_name: match[0],
					value: ""
				};
				stack.push(attribute);
				// Try to parse an attribute value
				if (pull(/^="/)) {
					while (!pull(/^"/)) {
						if (pull(/^([^"]+)/)) {
							attribute.value += match[0];
						} else {
							yield;
						}
					}
				}
				const popped = stack.pop();
				console.assert(popped === attribute, popped, attribute);
			} else {
				break;
			}	
		}
		return any_consumed;
	}

	function* parse_comment() {
		if (pull(/^<!--/)) {
			const prev_content = stack.pop();
			const comment = {
				comment_content: "",
				child_index: prev_content.content == "" ? prev_content.child_index : prev_content.child_index + 1
			};
			stack.push(comment);
			while (true) {
				// Pull as much text as we can
				if (pull(/^((?:[^-]|-(?!->))+)/)) {
					comment.comment_content += match[0];
				}
				// Try to pull a comment closing
				else if (pull(/^-->/)) {
					const popped = stack.pop();
					console.assert(comment === popped, comment, popped);
					stack.push({
						content: "",
						child_index: comment.child_index + 1
					});
					return true;
				}
				// Pause if we did neither:
				else {
					yield;
				}
			}
		} else {
			return false;
		}
	}

	function* parser() {
		stack.push({
			content: "",
			child_index: 0
		});
		try {
			yield* parse_content();
		} finally {
			if (unparsed.length > 0) {
				throw new Error("Parsing Error: Unused input");
			}
			if (stack.pop().content === undefined) {
				throw new Error("Parsing Error: Stack problem");
			}
		}
	}
	function* parse_content() {
		let any_consumed = false;
		while(true) {
			const top = get_top();
			// Open Tag
			if (pull(/^\<([a-zA-Z][\-a-zA-Z0-9]*)/)) {
				any_consumed = true;
				const tag_name = match[0];
				// Pop the content frame
				stack.pop();
				// Add a new tag frame
				const new_tag = {
					tag_name,
					child_index: (top.content === "") ?
						top.child_index :
						top.child_index + 1
				};
				stack.push(new_tag);
				// Parse any attributes until the end of the openning tag
				while (!pull(/^\s*\>/)) {
					if (!(yield* parse_attributes())) {
						yield;
					}
				}
				if (!VOID_TAGS.includes(tag_name)) {
					stack.push({
						content: "",
						child_index: 0
					});
					// If we're not a void tag then parse content until we get a close tag
					while (!pull(/^\<\/([a-zA-Z][a-zA-Z0-9\-]*)\>/)) {
						if (!(yield* parse_content())) {
							yield;
						}
					}
					if (match[0] !== tag_name) {
						throw new Error("Wrong closing tag: ", match[0], " !== ", tag_name);
					}
					const popped = stack.pop();
					console.assert(popped.content !== undefined, "Popped non content frame.");
				}
				// Pop the tag off the stack
				const popped = stack.pop();
				console.assert(new_tag === popped, new_tag, popped);
				stack.push({
					content: "",
					child_index: new_tag.child_index + 1
				});
			}
			// Comment Node
			else if (yield* parse_comment()) {
				any_consumed = true;
			}
			// Normal Text content
			else if (pull(/^([^\<]+)/)) {
				any_consumed = true;
				top.content += match[0];
			}
			// Nothing matched
			else {
				return any_consumed;
			}
		}
	}
	return [stack, function append(more) { unparsed += more; return unparsed; }, parser()];
}
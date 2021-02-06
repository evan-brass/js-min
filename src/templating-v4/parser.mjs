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

	const stack = [{
		content: "", child_index: 0
	}];
	function top() {
		return stack[stack.length - 1];
	}

	function* parse_content() {
		while (unparsed.length > 0) {
			// Parse the opening of a tag:
			if (pull(/^<([a-zA-Z][a-zA-Z0-9\-]*)/)) {
				const new_tag = { tag: match[0] };
				stack.push(new_tag);
				yield* parse_attributes();
				if (VOID_TAGS.includes(tag.toLowerCase())) {
					if (stack.pop() !== new_tag) {
						throw new Error("Stack Problem?");
					}
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
	
	return [root.children, function append(more) { unparsed += more; }, parse_content];
}

export async function tests() {
	function run(strings, ..._expressions) {
		const [result, append, thing] = parse_html();
		const parser = thing();
		for (const str of strings) {
			append(str);
			parser.next();
		}
		parser.return();
		return "stuff";
		return result;
	}
	[
		run`<p><b></b><i></i></p><div><span></span></div>`,
		run`<p>
			<b>bold content</b>
		</p>`,
		run`<a href="https://google.com">Google</a>`,
		run`<p>
			The world turns,
			it turns and it turns.
			Like a world it turns,
			<!-- Pause for effect... -->
			the world turns as a world would turn.
		</p>`,
		run`<form>
			<label>Username: <input type="text"></label>
			<label>Password: <input type="password"></label>
			<button>Login</button>
		</form>`
	].forEach(console.log);
}
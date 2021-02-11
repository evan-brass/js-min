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

	function pull(regex, handler = () => {}) {
		const match = regex.exec(unparsed);
		if (match !== null) {
			const [full_match, ...captures] = match;
			unparsed = unparsed.substr(full_match.length);
			handler(...captures);
			return true;
		} else {
			return false;
		}
	}
	function* parse_content(cursor) {
		let run = true;
		while (run && input.length > 0) {
			// Parse the opening of a tag:
			const success = pull(/^<([a-zA-Z][a-zA-Z0-9\-]*)/, tag => {
				const new_tag = { tag, attributes: {}, children: [] };
				cursor.children.push(new_tag);
				parse_attributes(new_tag);
				if (!VOID_TAGS.includes(tag.toLowerCase())) {
					yield* parse_content(new_tag);
				}
			})
			// Parse a comment node:
			|| pull(/^<!--((?:[^-]|-(?!->))*)-->/, comment => {
				cursor.children.push({
					comment
				})
			})
			// Parse a closing tag
			|| pull(/^<\/([a-zA-Z][a-zA-Z0-9\-]*)>/, tag => {
				if (
					cursor.tag === undefined ||
					cursor.tag.toLowerCase() !== tag.toLowerCase()
				) {
					throw new Error("Closing tag doesn't match");
				}
				run = false;
			})
			// Parse a text node
			|| pull(/^([^<]+)/, text => {
				cursor.children.push({
					text
				});
			});
			if (!success) {
				throw new Error("Parsing Error: No rules matched");
			}
		}
	}
	function* parse_attributes(cursor) {
		while(pull(/^\s+([a-zA-Z][a-zA-Z0-9\-]+)="([^"]*)"/, (
			name,
			value
		) => {
			cursor.attributes[name] = value;
		})) {}
		if (!pull(/^\s*>/)) {
			throw new Error("Malformed open tag");
		}
	}
	
	return [root.children, unparsed, parse_content];
}


export async function tests() {
	const _ = undefined;
	function run(strings) {
		const [root, unparsed, parser] = html_parser();
		for (const string of strings) {
			parser.next(string);
		}
		parser.return();
		return root;
	}

	run`
		<nav>
			<a href="/">Home</a>
			<a href="../about.html">About</a>
		</nav>
		<main>
			<article>
				<header>
					<h1>Fighting Cancer with Viral Therapy</h1>
					by <span>Evan Brass</span><br>
					last updated on <date>January </date>
				</header>
				<p>
					lorem ipsom dolor sit amet truvia no remos bill scotch demonstration of rationality when confronted with cause for alarm. You never know what could happen.
				</p>
			</article>
		</main>
	`;
}
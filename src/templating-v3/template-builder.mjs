
export function apply_path(root, path) {
	let node = root;
	for (const index of path) {
		node = node.childNodes[index];
	}
	return node;
}

export default class TemplateBuilder {
	#unparsed = ""
	#output = ""
	#stack = [{
		content: "", child_index: 0
	}]
	#init_funcs = []
	#pull(regex, handler = false) {
		const match = regex.exec(this.#unparsed);
		if (match !== null) {
			const full_match = match.shift();
			this.#unparsed = this.#unparsed.substr(full_match.length);
			this.#output += full_match; // TODO: Make this configurable?
			if (handler) {
				handler(...match);
			}
			return true;
		} else {
			return false;
		}
	}
	#top() {
		return this.#stack[this.#stack.length - 1];
	}
	finish() {
		if (this.#unparsed.length > 0) {
			throw new Error("Parsing Error: Unused input");
		}
		if (this.#stack.length > 1 || this.#top().content === undefined) {
			throw new Error("Parsing Error: Stack problem");
		}

		const template = document.createElement('template');
		template.innerHTML = this.#output;

		const init_funcs = this.#init_funcs;

		// TODO: Fragment pooling

		return function template_instantiate() {
			let frag = document.importNode(template.content, true);
			for (const func of init_funcs) {
				func(frag);
			}
			return frag;
		};
	}
	add_init(func) {
		this.#init_funcs.push(func);
	}
	decendent_path() {
		if (this.#top().tag_name === undefined) {
			throw new Error("Builder wasn't in attribute position.");
		}
		const path = [];
		for (const frame of this.#stack) {
			if (frame.child_index !== undefined) {
				path.push(frame.child_index);
			}
		}
		return path;
	}
	add_html(str) {
		// Add the new content and then continue parsing
		this.#unparsed += str;
		while(this.#unparsed.length > 0) {
			const top = this.#top();
			if (top.content !== undefined) {
				// Tag opening
				const suceeded = this.#pull(/^\<([a-zA-Z][\-a-zA-Z0-9]*)/, tag_name => {
					// Pop the content frame
					this.#stack.pop();
					// Add a new tag frame
					this.#stack.push({
						tag_name,
						child_index: (top.content === "") ?
							top.child_index :
							top.child_index + 1
					});
				})
				// Tag closing
				|| this.#pull(/^\<\/([a-zA-Z][a-zA-Z0-9\-]*)\>/, tag_name => {
					// Pop the content off
					this.#stack.pop();
					const opener = this.#top();
					// TODO: Use .toLower in all tag_name comparisons
					if (opener === undefined || opener.tag_name !== tag_name) {
						throw new Error("Mismatched closing tag");
					}
					// Pop the opener off
					this.#stack.pop();
					// Create a new content frame
					this.#stack.push({
						content: "",
						child_index: opener.child_index + 1
					});
				})
				// Comment Node
				|| this.#pull(/^<!--((?:[^-]|-(?!->))*)/, comment_content => {
					this.#stack.pop();
					this.#stack.push({
						comment_content,
						child_index: top.content !== "" ? top.child_index + 1 : top.child_index
					});
				})
				// Normal Text content
				|| this.#pull(/^([^\<]+)/, text => {
					top.content += text;
				});
				if (!suceeded) {
					break;
				}
			} else if (top.tag_name) {
				// Attribute position
				this.#pull(/^(?:\s+[a-zA-Z][a-zA-Z0-9\-]*(?:\=\"[^\"]*\")?)*/);

				// Try to close the tag
				const suceeded = this.#pull(/^\s*\>/, () => {
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
					let child_index = 0;
					if (VOID_TAGS.includes(top.tag_name)) {
						child_index = top.child_index + 1;
						this.#stack.pop();
					}
					this.#stack.push({
						content: "",
						child_index
					});
				})
				// Or open an attribute
				|| this.#pull(/^\s+([a-zA-Z][a-zA-Z0-9\-]*)\=\"/, attribute_name => {
					this.#stack.push({
						attribute_name,
						value: ""
					});
				});
				if (!suceeded) {
					break;
				}
			} else if (top.attribute_name) {
				// Attribute value position
				// Extend the attribute value
				this.#pull(/^([^\"]+)/, value => {
					top.value += value;
				});
				// Try to close the attribute
				this.#pull(/^\"/, () => {
					this.#stack.pop();
				});
			} else if (top.comment_content !== undefined) {
				this.#pull(/((?:[^-]|-(?!->))+)/, content => {
					top.comment_content += content;
				});
				this.#pull(/-->/, () => {
					this.#stack.pop();
					this.#stack.push({
						content: "",
						child_index: top.child_index + 1
					});
				});
			} else {
				throw new Error("Unknown stack state.");
			}
		}
	}
}
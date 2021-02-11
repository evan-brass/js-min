import Parser from './parser.mjs';

export default async function tests() {
	function run(strings, ...expressions) {
		const parser = new Parser();
		for (const str of strings) {
			parser.advance(str);
			if (expressions.length > 0) {
				expressions.shift()(parser.stack);
			}
		}
		parser.finish();
	}
	function check_stack(test_stack) {
		return stack => {
			console.assert(stack.length === test_stack.length);
			for (let i = 0; i < test_stack.length; ++i) {
				const test_item = test_stack[i];
				const item = stack[i];
				for (const key in test_item) {
					console.assert(test_item[key] == item[key]);
				}
			}
		}
	}
	const cs = check_stack;
	function tag(tag_name, child_index) {
		return {
			tag_name,
			child_index
		};
	}
	const t = tag;
	function text(content, child_index) {
		return {
			content,
			child_index
		};
	}
	const x = text;
	function attribute(attribute_name, value) {
		return {
			attribute_name, value
		};
	}
	const a = attribute;
	function comment(comment_content, child_index) {
		return {
			comment_content, child_index
		};
	}
	const c = comment;

	const t1 = cs([
		t('p', 0),
		t('i', 1)
	]);
	run`<p><b></b><i${t1}></i></p><div><span></span></div>`;

	const t2 = cs([
		t('p', 0),
		t('b', 1),
		x('bold ', 0)
	]);
	run`<p>
		<b>bold ${t2}content</b>
	</p>`;

	const t3 = cs([
		t('a', 0),
		a('href', 'https://goog')
	]);
	run`<a href="https://goog${t3}le.com">Google</a>`;

	const t4 = cs([
		t('p', 0),
		c(' Pause fo', 1)
	]);
	run`<p>
		The world turns,
		it turns and it turns.
		Like a world it turns,
		<!-- Pause fo${t4}r effect... -->
		the world turns as a world would turn.
	</p>`;

	const t5 = cs([
		t('form', 0),
		t('label', 1),
		t('input', 1)
	]);
	run`<form>
		<label>Username: <input${t5} type="text"></label>
		<label>Password: <input type="password"></label>
		<button>Login</button>
	</form>`;
}
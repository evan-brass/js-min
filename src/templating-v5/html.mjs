import get_or_set from '../lib/get-or-set.mjs';
import zip from '../lib/zip.mjs';
import Parser from './parser.mjs';
import { get_path, compile_paths } from './descendant-path.mjs';
import { apply_value } from './expr.mjs';

const template_cache = new WeakMap();

export default function html(strings, ...values) {
	const init = get_or_set(template_cache, strings, function make_template() {
		const parser = new Parser();
		const paths = [];
		let i;
		for (i = 0; i < strings.length - 1; ++i) {
			parser.advance(strings[i]);
			const need_placeholder = parser.top().content !== undefined;
			if (need_placeholder) {
				parser.advance('<!--');
			}

			paths.push(get_path(parser.stack));

			if (need_placeholder) {
				parser.advance('-->');
			}
		}
		parser.advance(strings[i]); // Always one more string than there are values.

		const template = parser.finish();
		const apply_paths = compile_paths(paths);
		return values => {
			const frag = document.importNode(template.content, true);
			const els = apply_paths(frag);

			for (const [value, el] of zip(values, els)) {
				apply_value(value, el);
			}

			return frag;
		};
	});

	return init(values);
}
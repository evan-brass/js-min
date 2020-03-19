import sha1 from 'lib/string-hash.mjs';
import convertMarkers from './parts/convert-markers.mjs';
import default_template_builder from './template-builder.mjs';

import awaitReplace from './users/await-replace.mjs';

// TODO: Probably should be a WeakMap
const id_cache = new Map();

const constructors = new Map();

function html_id(id, ...expressions) {
	const constructor = constructors.get(id);
	const inst = constructor.get_instance(); // By letting the constructor decide how to get an instance (could be from a pool, could be made from scratch, etc.) we don't need to have a bunch of options.
	inst.connect(expressions);
	return inst;
}
function make_html(template_builder) {
	return function html(strings, ...expressions) {
		let id = id_cache.get(strings);
		if (!id) {
			return awaitReplace((async () => {
				const id = 'a' + await sha1(strings.join('{{}}'));
				id_cache.set(strings, id);

				if (!constructors.has(id)) {
					// Create a template
					let order = 0;
					let template_contents = strings[0];
					for (let i = 1; i < strings.length; ++i) {
						template_contents += `${id}-${order++}`;
						template_contents += strings[i];
					}
					const template = document.createElement('template');
					template.innerHTML = template_contents;

					convertMarkers(template, id);

					constructors.set(id, template_builder.build(template));
				}

				return html_id(id, ...expressions);
			})());
		} else {
			return html_id(id, ...expressions);
		}
	};
}
const html = make_html(default_template_builder);
html.with_builder = make_html;

export { html as default, html, html_id };
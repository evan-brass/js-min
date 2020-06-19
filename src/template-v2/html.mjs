import create_template from './create-template.mjs';
import instantiate_template from './instantiate-template.mjs';

const template_cache = new WeakMap();

export default function html(strings, ...expressions) {
	let template = template_cache.get(strings);
	if (!template) {
		template = create_template(strings);
		template_cache.set(strings, template);
	}

	return instantiate_template(template, expressions);
}
import TemplatingContext from './context.mjs';
import TemplateBuilder from './template-builder.mjs';

import e2u from 'users/def-expr2user.mjs';

const default_context = new TemplatingContext().set_expr2user(e2u).set_default_instance_builder(
	new TemplateBuilder()
);
const html = default_context.html.bind(default_context);
const css = default_context.css.bind(default_context);
const mount = default_context.mount.bind(default_context);
export { 
	default_context as default,
	html,
	css,
	mount
};
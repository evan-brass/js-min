import TemplatingContext from './context.mjs';
import TemplateBuilder from './template-builder.mjs';

import e2u from 'users/def-expr2user.mjs';

export default new TemplatingContext().set_expr2user(e2u).set_default_builder(
	new TemplateBuilder()
);
import {getTemplateInstance} from 'users/template-instance.mjs';
import {getTemplate, getTemplate_id} from './template.mjs';
import awaitReplace from 'users/await-replace.mjs';

async function stringsToInstance(strings) {
    return getTemplateInstance(await getTemplate(strings));
}

export function html_id(id, expressions) {
    const instance = getTemplateInstance(getTemplate_id(id));

    instance.connect(expressions);
    return instance;
}
export default function html(strings, ...expressions) {
	return awaitReplace((async () => {
		const instance = await stringsToInstance(strings);
		
		instance.connect(expressions);
		return instance;
	})());
}
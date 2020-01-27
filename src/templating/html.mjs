import {getTemplateInstance} from 'users/template-instance.mjs';
import {getTemplate, getTemplate_id} from './template.mjs';

function stringsToInstance(strings) {
    return getTemplateInstance(getTemplate(strings));
}

export function html_id(id, expressions) {
    const instance = getTemplateInstance(getTemplate_id(id));

    instance.connect(expressions);
    return instance;
}
export default function html(strings, ...expressions) {
    const instance = stringsToInstance(strings);
    
    instance.connect(expressions);
    return instance;
}
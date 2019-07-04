import {PartUser, getTemplateInstance} from './instance.mjs';
import {getTemplate, getTemplate_id} from './template.mjs';

function stringsToInstance(strings) {
    return getTemplateInstance(getTemplate(strings));
}
function normalizeExpressions(expressions) {
    for (let i = 0; i < expressions.length; ++i) {
        const expr = expressions[i];
        if (!(expr instanceof PartUser)) {
            if (expr[Symbol.asyncIterator]) {
                let iteration;
                expressions[i] = {
                    acceptTypes: ["node", "attribute-value", "attribute"],
                    bind(part) {
                        iteration = (async function*(){
                            for await(const value of expr) {
                                part.update(value);
                            }
                        })();
                        iteration.next();
                    },
                    unbind(part) {
                        iteration.return();
                    },
                    get [PartUser]() { return this; }
                }
            }
        }
    }
}
export function html_id(id, expressions) {
    const instance = getTemplateInstance(getTemplate_id(id));

    normalizeExpressions(expressions);

    instance.connect(expressions);
    return instance;
}
export default function html(strings, ...expressions) {
    const instance = stringsToInstance(strings);

    normalizeExpressions(expressions);
    
    instance.connect(expressions);
    return instance;
}
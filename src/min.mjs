import {PartUser, getTemplateInstance} from './instance.mjs';
import {getTemplate, getTemplate_id} from './template.mjs';
import {s} from './expressions.mjs';

function stringsToInstance(strings) {
    return getTemplateInstance(getTemplate(strings));
}

// MAYBE: Instead of normalize expression, what about validateExpression(expr, partType) ?

export function normalizeExpression(expr) {
    if (!(expr instanceof PartUser)) {
        if (expr[Symbol.asyncIterator]) {
            let iteration;
            return {
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
        } else {
            return s(expr);
        }
    } else {
        return expr;
    }
}
export function html_id(id, expressions) {
    const instance = getTemplateInstance(getTemplate_id(id));

    expressions = expressions.map(normalizeExpression);

    instance.connect(expressions);
    return instance;
}
export default function html(strings, ...expressions) {
    const instance = stringsToInstance(strings);

    expressions = expressions.map(normalizeExpression);
    
    instance.connect(expressions);
    return instance;
}
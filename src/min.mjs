import Instance, {getInstance} from './instance.mjs';
import {TemplateCache, createTemplate} from './template.mjs';

function stringsToInstance(strings) {
    if (!TemplateCache.has(strings)) {
        TemplateCache.set(strings, createTemplate(strings));
    }
    const template = TemplateCache.get(strings);
    return getInstance(template);
}
export default function sample_min_templater(strings, ...expressions) {
    const instance = stringsToInstance(strings);
    
    // Any additional processing on the expressions before connecting
    for (let i = 0; i < expressions.length; ++i) {
        const expr = expressions[i];
        if (!expr[Instance.NodeUser]) {
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
                    get [Instance.PartUser]() { return this; }
                }
            }
        }
    }

    instance.connect(expressions);
    return instance;
}
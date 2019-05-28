import {PartUser, getTemplateInstance} from './instance.mjs';
import {getTemplate} from './template.mjs';

function stringsToInstance(strings) {
    return getTemplateInstance(getTemplate(strings));
}
export default function sample_min_templater(strings, ...expressions) {
    const instance = stringsToInstance(strings);
    
    // Any additional processing on the expressions before connecting
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

    instance.connect(expressions);
    return instance;
}
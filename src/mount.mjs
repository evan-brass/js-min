import NodePart from './parts/node-part.mjs';
import { expression2user } from './users/common.mjs';

export default function mount(expression, root = document.body) {
    const temp = new Text();
    root.appendChild(temp);
    const part = new NodePart(temp);
    const user = expression2user(expression);
    user.bind(part);
}
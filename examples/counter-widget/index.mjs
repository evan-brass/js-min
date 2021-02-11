import html from '../../src/templating/html.mjs';
import mount from '../../src/templating/mount.mjs';
import { use_later } from '../../src/reactivity/use.mjs';
import single from '../../src/reactivity/single.mjs';
import on from '../../src/templating/on.mjs';
import set_text from '../../src/templating/set_text.mjs';

const count = single(10);

mount(html`
	<button ${on('click', () => count.value -= 1)}>-</button>
	${set_text(use_later(t => t(count.value), true))}
	<button ${on('click', () => count.value += 1)}>+</button>
`, document.body);
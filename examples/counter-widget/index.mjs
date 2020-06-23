import html from '../../src/template-v2/html.mjs';
import mount from '../../src/template-v2/mount.mjs';
import LiveData from '../../src/reactivity/live-data.mjs';
import on from '../../src/template-v2/on.mjs';

const count = new LiveData();
count.value = 10;

mount(html`
	<button ${on('click', () => count.value -= 1)}>-</button>
	${count}
	<button ${on('click', () => count.value += 1)}>+</button>
`, document.body);
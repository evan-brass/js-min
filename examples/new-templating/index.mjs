import html from '../../src/template-v2/html.mjs';
import mount from '../../src/template-v2/mount.mjs';
import on from '../../src/template-v2/on.mjs';
import LiveData from '../../src/reactivity/live-data.mjs';

function counter() {
	const count = new LiveData(5);
	return html`
		<button ${on('click', _ => count.value -= 1)}>-</button>
		${count}
		<button ${on('click', _ => count.value += 1)}>+</button>
	`;
}
mount(counter());
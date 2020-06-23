import html from '../../src/template-v2/html.mjs';
import LiveData from '../../src/reactivity/live-data.mjs';
import on from '../../src/template-v2/on.mjs';

const count = new LiveData();
count.value = 10;

document.body.appendChild(html`
	<button ${on('click', () => count.value -= 1)}>-</button>
	${count}
	<button ${on('click', () => count.value += 1)}>+</button>
`);
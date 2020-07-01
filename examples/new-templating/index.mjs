import html from '../../src/template-v2/html.mjs';
import mount from '../../src/template-v2/mount.mjs';
import on from '../../src/template-v2/on.mjs';
import LiveData from '../../src/reactivity/live-data.mjs';

function sink(source) {
	return async function(el) {
		for await (const val of source) {
			el.replaceWith(val);
			el = val;
		}
	}
}

mount(html`
	<h1>Title: ${el => el.replaceWith('Replaced text.')}</h1>
	<p>
		This is a post.
		<button ${on('click', _ => alert("Hello world"))}> Click Me!</button>
	</p>
`);

function counter() {
	const count = new LiveData(5);
	return html`
		<button ${on('click', _ => count.value -= 1)}>-</button>
		${sink((async function*() {
			for await (const v of count) {
				yield new Text(v);
			}
		})())}
		<button ${on('click', _ => count.value += 1)}>+</button>
	`;
}
mount(counter());
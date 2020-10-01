import html from '../../src/template-v2/html.mjs';
import mount from '../../src/template-v2/mount.mjs';
import on from '../../src/template-v2/on.mjs';
import LiveData from '../../src/reactivity/live-data.mjs';
import { state } from '../../src/change/change.mjs';

function counter() {
	const count = new LiveData(5);
	return html`
		<button ${on('click', _ => count.value -= 1)}>-</button>
		${count}
		<button ${on('click', _ => count.value += 1)}>+</button>
	`;
}
function counter_state() {
	const count = state(5);
	const times_five = count.map(x => 5 * x);
	return html`
		<button ${on('click', _ => count.value -= 1)}>-</button>
		${(target, signal) => {
			if (target.nodeType !== Node.COMMENT_NODE) throw new Error('Expected a comment node.');
			const text = new Text(times_five.value);
			target.replaceWith(text);
			const handler = new_count => text.data = new_count;
			times_five.watchers.add(handler);
			signal.addEventListener('abort', _ => times_five.watchers.delete(handler), { once: true });
		}}
		<button ${on('click', _ => count.value += 1)}>+</button>
	`;
}
mount(counter());
mount(counter_state());

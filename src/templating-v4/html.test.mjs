import html from './html.mjs';
import { text, on } from './expressions.mjs';
import single from '../reactivity/single.mjs';
import use_now from '../reactivity/use.mjs';

export default async function test() {
	const counter = single(5);
	const instantiate = html`
		<button ${on('click', () => counter.value += 1)}>+</button>
		${text(text => use_now(() => {
			text.data = counter.value;
		}))}
		<button ${on('click', () => counter.value -= 1)}>-</button>
	`();
	const fragment = instantiate();
	document.body.appendChild(fragment);
}
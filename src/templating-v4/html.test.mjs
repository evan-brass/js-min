import {html, inst} from './html.mjs';
import { text, on } from './expressions.mjs';
import single from '../reactivity/single.mjs';
import use_now from '../reactivity/use.mjs';

function make_counter() {
	const counter = single(5);
	const value = html`
		<button ${on('click', () => counter.value += 1)}>+</button>
		${text(text => use_now(() => {
			text.data = counter.value;
		}))}
		<button ${on('click', () => counter.value -= 1)}>-</button>
	`;
	console.log(value);
	const fragment = inst(value);
	return fragment;
}

export default async function test() {
	console.log(text(node => {
		node.data = "Something";
	}));

	document.body.appendChild(make_counter());
	document.body.appendChild(document.createElement('br'));
	document.body.appendChild(make_counter());
}
import html from '../../src/template-v2/html.mjs';
import mount from '../../src/template-v2/mount.mjs';
import on from '../../src/template-v2/on.mjs';
import { single } from '../../src/straw-react/single.mjs';
import { use } from '../../src/straw-react/use.mjs';

function text(func) {
	return function text_handler (el, signal) {
		const text = new Text();
		el.replaceWith(text);
		signal.addEventListener('abort', function text_cleanup() { text.replaceWith(new Comment()); });
		const set_text = val => { text.data = val; };

		func(set_text, signal);
	};
}
function use_part(func) {
	return function use_part_handler (...args) {
		const signal = args.pop();
		use(func.bind(undefined, ...args), signal);
	};
}

function counter_component() {
	const count = single(5);
	return html`
		<button ${on('click', function decrement_count(){ count.value -= 1; })}>-</button>
		${text(use_part(function update_count(set_text) { set_text(count.value); }))}
		<button ${on('click', function increment_count() { count.value += 1; })}>+</button>
	`;
}
mount(counter_component());

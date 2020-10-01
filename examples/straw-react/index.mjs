import html from '../../src/template-v2/html.mjs';
import mount from '../../src/template-v2/mount.mjs';
import on from '../../src/template-v2/on.mjs';
import { single } from '../../src/straw-react/single.mjs';
import { use } from '../../src/straw-react/use.mjs';
import list from '../../src/straw-react/list.mjs';
import { push_context, pop_context } from '../../src/straw-react/context.mjs';
import apply_expression from '../../src/template-v2/apply-expression.mjs';

function text(func) {
	return function text_handler (el, signal) {
		if (el.nodeType !== Node.COMMENT_NODE) throw new Error("Text can only be used in a node position.");
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
function children(list, wrap_tagname, map_func) {
	return function children_handler(el, signal) {
		if (el.nodeType == Node.COMMENT_NODE) throw new Error("Children can only be used in an attribute position.");
		if (el.children.length > 0) throw new Error("Children can only be used on elements which don't already have children.  They would be overwritten otherwise.");
		const unmounts = [];
		const splice_handler = (index, remove_count, added_count) => {
			push_context(splice_handler);

			for (let i = 0; i < remove_count; ++i) {
				unmounts[index + i]();
				el.children[index].remove();
			}
			unmounts.splice(index, remove_count, ...list.all().slice(index, index + added_count).map((item, i) => {
				const wrapper = document.createElement(wrap_tagname);
				el.insertBefore(wrapper, el.children[index + i + 1]);
				const expression = map_func(wrapper, item);
				return mount(expression, wrapper);
			}));
			pop_context(splice_handler);
		};
		push_context(splice_handler);
		for (const expression of list.all()) {
			let wrapper = document.createElement(wrap_tagname);
			el.appendChild(wrapper);
			unmounts.push(mount(expression, wrapper));
		}
		pop_context(splice_handler);

		signal.addEventListener('abort', () => {
			for (func of unmounts) func();
		})
	}
}

function counter_component() {
	const count = single(5);
	const l = list();
	return html`
		<button ${on('click', _ => count.value -= 1)}>-</button>
		${text(use_part(set_text => set_text(count.value)))}
		<button ${on('click', _ => count.value += 1)}>+</button><br>

		<button ${on('click', _ => l.push(count.value))}>Add to list</button><br>

		<ul ${children(l.map(num => html`${num} <button>X</button>`), 'li')} ${on('click', e => {
			if (e.target.matches('button')) {
				const li = e.target.closest('li');
				const index = Array.prototype.indexOf.call(li.parentElement.children, li);
				l.splice(index, 1);
			}
		})}></ul>
	`;
}
mount(counter_component());

// setTimeout(_ => mount(counter_component()), 1000);

import NodeArray from '../../users/node-array.mjs';
import html from '../../html.mjs';
import on from '../../users/on.mjs';
import ref from '../../users/ref.mjs';

function makeLi(contents) {
	/*
	const li = document.createElement('li');
	li.innerText = contents;
	return li;
	// */
	return html`<li>${contents}</li>`;
}

function arrayOps(handler) {
	let inputEl;
	let addCount;
	function* repeat(times = 1) {
		for (let i = 0; i < times; ++i) {
			yield makeLi(inputEl.value);
		}
	}
	return html`
	<input ${ref(el => inputEl = el)} value="6 new" type="text"><br>
	<label>Add Count:<input type="number" step="1" value="2" ${ref(el => addCount = el)}></label><br>
	${['unshift', 'shift', 'push', 'pop'].map(op => 
		html`<button ${on('click', _ => {
			handler(op, ...repeat(addCount.valueAsNumber))
		})}>
			${op}
		</button>`
	)}<br>
	${(function() {
		let start;
		let remove;
		return html`
			<label>Start:<input type="number" step="1" value="2" ${ref(el => start = el)}></label><br>
			<label>Delete Count:<input type="number" step="1" value="2" ${ref(el => remove = el)}></label><br>
			<button ${on('click', _ => {
				handler('splice', start.valueAsNumber, remove.valueAsNumber, ...repeat(addCount.valueAsNumber));
			})}>Splice</button>
		`;
	})()}`;
}

export default function nodeArrayTest() {
	const listItems = new NodeArray(
		['2 test', '1 test', '3 test'].map(makeLi)
	);
	return html`
	<h2>Node Array Tests</h2>
	<h3>With Array optimizations</h3>
	${arrayOps((op, ...args) => {
		listItems.array[op].apply(listItems.array, args);
	})}
	<h3>Without Array optimizations</h3>
	${arrayOps((op, ...args) => {
		Array.prototype[op].apply(listItems.array, args);
	})}
	<ul>
		${listItems}
	</ul>
	`
}
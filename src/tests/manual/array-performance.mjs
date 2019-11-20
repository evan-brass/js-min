import NodeArray from '../../users/node-array.mjs';
import html from '../../html.mjs';
import on from '../../users/on.mjs';
import ref from '../../users/ref.mjs';

export default function arrayPerformanceTests() {
	const listItems = new NodeArray([]);
	let ul;
	const tests = [
		["Customized Implementation", listItems.push.bind(listItems)],
		["Native Implementation", Array.prototype.push.bind(listItems.array)]
	];

	return html`
	<h2>Node Array Performance Tests:</h2>
	${tests.map(([description, func]) => html`
		<button ${on('click', () => {
			console.time("array-performance");
			for (let i = 1; i <= 1000; ++i) {
				let el = document.createElement('li');
				el.innerText = Math.random() * 500;
				func(el);
			}
			console.timeEnd("array-performance");
			console.time("array-reflow");
			ul.getBoundingClientRect(); // Force a reflow
			console.timeEnd('array-reflow');
		})}>
			Push 1000 items: ${description}
		</button><br>
	`)}
	<button ${on('click', () => {
		console.time("array-performance");
		for (let i = 1; i <= 1000; ++i) {
			let el = document.createElement('li');
			el.innerText = Math.random() * 500;
			ul.appendChild(el);
		}
		console.timeEnd("array-performance");
		console.time("array-reflow");
		ul.getBoundingClientRect(); // Force a reflow
		console.timeEnd('array-reflow');
	})}>Push 100 items straight speed</button><br>
	<button ${on('click', () => listItems.array.length = 0)}>Clear</button><br>
	<button ${on('click', () => ul.querySelectorAll('li').forEach(el => el.remove()))}>Clear Items</button><br>
	<button ${on('click', () => console.log(listItems))}>Print List</button>
	<ul ${ref(el => ul = el)}>
		${listItems}
	</ul>
	`
}
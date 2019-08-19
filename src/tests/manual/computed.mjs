import html from '../../html.mjs';
import LiveData from '../../reactivity/live-data.mjs';
import on from '../../users/on.mjs';
import Computed from '../../reactivity/computed.mjs';

export default function computedTest() {
	const a = new LiveData();
	a.value = 5;
	const b = new LiveData();
	b.value = 10;
	const c = new LiveData();
	c.value = 10;
	const ab = new Computed((a, b) => a + b, a, b);
	const abc = new Computed((ab, c) => ab + c, ab, c);
	return html`
	<h2>Computed Tests:</h2>
	<label>
		a: ${a}
		<input type="range" 
			value="${a.value}" 
			min="1" max="10" step="1" 
			${on('input', e => a.value = e.target.valueAsNumber)}
		>
	</label><br>
	<label>
		b: ${b}
		<input type="range" 
			value="${b.value}"
			min="1" max="10" step="1" 
			${on('input', e => b.value = e.target.valueAsNumber)}
		>
	</label><br>
	<label>
		c: ${c}
		<input type="range" 
			value="${c.value}"
			min="1" max="10" step="1" 
			${on('input', e => c.value = e.target.valueAsNumber)}
		>
	</label><br>
	<label>
		a + b: 
		<input type="number" disabled value="${ab}">
	</label><br>
	<label>
		(a + b) + c: 
		<input type="number" disabled value="${abc}">
	</label><br>
	`;
}
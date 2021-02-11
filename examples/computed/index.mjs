import html from '../../src/templating/html.mjs';
import mount from '../../src/templating/mount.mjs';
import on from '../../src/templating/on.mjs';
import single from '../../src/reactivity/single.mjs';
import computed from '../../src/reactivity/computed.mjs';
import { use_later } from '../../src/reactivity/use.mjs';
import set_text from '../../src/templating/set_text.mjs';

const a = single(5);
const b = single(10);
const c = single(10);
const ab = computed(() => a.value + b.value);
const abc = computed(() => ab.value + c.value);

mount(html`
	<h2>Computed Tests:</h2>
	<label>
		<input type="range"
			${el => el.value = a.value}
			min="1" max="10" step="1" 
			${on('input', e => a.value = e.target.valueAsNumber)}
		>
		a: ${set_text(use_later(t => t(a.value), true))}
	</label><br>
	<label>
		<input type="range"
			${el => el.value = b.value}
			min="1" max="10" step="1"
			${on('input', e => b.value = e.target.valueAsNumber)}
		>
		b: ${set_text(use_later(t => t(b.value), true))}
	</label><br>
	<label>
		<input type="range"
			${el => el.value = c.value}
			min="1" max="10" step="1" 
			${on('input', e => c.value = e.target.valueAsNumber)}
		>
		c: ${set_text(use_later(t => t(c.value), true))}
	</label><br>
	<label>
		a + b: 
		<input type="number" disabled ${use_later(el => el.value = ab.value, true)}>
	</label><br>
	<label>
		(a + b) + c: 
		<input type="number" disabled ${use_later(el => el.value = abc.value, true)}>
	</label><br>
`, document.body);
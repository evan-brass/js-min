import html from '../../src/templating/html.mjs';
import mount from '../../src/templating/mount.mjs';
import on from '../../src/templating/users/on.mjs';
import LiveData from '../../src/reactivity/live-data.mjs';

const radius = new LiveData();
radius.value = 50;

mount(html`
	<h2>Test modifying SVG attribute</h2>
	<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
		<circle cx="50" cy="50" r="${radius}"/>
	</svg>
	<input type="range" 
		value="${radius.value}" 
		min="10" max="70" step="1" 
		${on('input', e => radius.value = e.target.valueAsNumber)}
	/>
`, document.body);
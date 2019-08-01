import html from '../../html.mjs';
import LiveData from '../../lib/live-data.mjs';
import on from '../../users/on.mjs';

export default function svg(){
	const radius = new LiveData();
	radius.value = 50;
	return html`
	<h2>Test modifying SVG attribute</h2>
	<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
		<circle cx="50" cy="50" r="${radius}"/>
	</svg>
	<input type="range" 
		value="${radius.value}" 
		min="10" max="70" step="1" 
		${on('input', e => radius.value = e.target.valueAsNumber)}
	/>
	`;
}
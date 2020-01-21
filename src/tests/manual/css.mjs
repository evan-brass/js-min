// @flow

import html from '../../html.mjs';
import on from '../../users/on.mjs';
import LiveData from '../../reactivity/live-data.mjs';
import css from '../../users/css.mjs';

export default function cssTest(){
	const color = new LiveData();
	color.value = 'black';
	return html`
	<h2 class="testing-css">Test Modifying CSS using the css tag</h2>
	${css`h2.testing-css { 
		color: ${color};
	}`}
	${[
		'Red', 'Cornsilk', 'Black', 'Navy', 'Teal', 'RebeccaPurple'
	].map(val => html`
		<button ${on('click', _ => color.value = val.toLowerCase())}>
			${val}
		</button>`
	)}
	`;
}
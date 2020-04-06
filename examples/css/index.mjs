import LiveData from '../../src/reactivity/live-data.mjs';
import html from '../../src/templating/html.mjs';
import mount from '../../src/templating/mount.mjs';
import css from '../../src/templating/css.mjs';
import on from '../../src/templating/users/on.mjs';

const color = new LiveData('rebeccapurple');

mount(html`
	<h2 class="testing-css">Test Modifying CSS using the css tag</h2>
	${css`h2.testing-css { 
		color: ${color};
	}`}
	${[
		'Red', 'Cornsilk', 'Black', 'Navy', 'Teal', 'RebeccaPurple', 'HotPink'
	].map(val => html`
				<button ${on('click', _ => color.value = val.toLowerCase())}>
					${val}
				</button>`
	)}
`, document.body);
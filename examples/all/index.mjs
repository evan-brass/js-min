import html from '../../src/templating/html.mjs';
import mount from '../../src/templating/mount.mjs';
import on from '../../src/templating/users/on.mjs';

mount(html`<button ${on('click', () => {
	document.querySelectorAll('iframe').forEach(iframe => {
		iframe.style.height = iframe.contentWindow.document.body.scrollHeight + 'px';
	});
})}>Resize inline frames</button>`);

[
	['Counter Widget', '../counter-widget/'],
	['Calendar', '../calendar/'],
	['Async Generator', '../async-generator/'],
	['Computed', '../computed/'],
	['CSS', '../css/'],
	['NodeArray', '../node-array/'],
	['SVG', '../svg/'],
	['Dial', '../dial/'],
	['Array Performance', '../array-performance/'],
	['Swapping Test', '../swapping/'],
	['Homework', '../homework/'],
	['Sudoku', '../sudoku/'],
	['Base Test', '../base-test/'],
].forEach(([name, path]) => {
	mount(html`
		<a href="${path}">
			<h1>${name}</h1>
		</a>
		<iframe src="${path}" loading="eager"></iframe>
	`);
});
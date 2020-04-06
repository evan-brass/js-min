import html from '../../src/templating/html.mjs';
import mount from '../../src/templating/mount.mjs';
import delay from '../../src/lib/delay.mjs';

mount(html`
	<h2>Test Swapping</h2>
	${(async function*() {
		function shouldSwap(txt) {
			return html`<b>Should Swap:</b>${txt}`;
		}
		while(1) {
			yield shouldSwap('1');
			await delay(1000);
			yield shouldSwap('2');
			await delay(1000);
			yield html`<i>Shouldn't Swap</i>`;
			await delay(1000);
		}
	})()}
`);
/* eslint-disable indent */
import Base from '../../src/custom-elements/base.mjs';
import html from '../../src/templating/html.mjs';
import delay from '../../src/lib/delay.mjs';
import range from '../../src/lib/range.mjs';
import css from '../../src/templating/css.mjs';
import mount from '../../src/templating/mount.mjs';

class Test1 extends Base {
	async run(abortSignal) {
		const unmount = mount(html`
			${(async function* () {
				while (1) {
					yield css`:host {
										color: lime;
									}`;
					await delay(1000);
					yield css`:host {
										background-color: lime;
									}`;
					await delay(1000);
				}
			})()}
			${(async function* () {
				while (1) {
					for (const i of range(20, 0)) {
						yield 'a'.repeat(i);
						await delay(500);
					}
				}
			})()}
		`, this.shadowRoot);
		abortSignal.addEventListener('abort', unmount);
	}
}
customElements.define('test-1', Test1);
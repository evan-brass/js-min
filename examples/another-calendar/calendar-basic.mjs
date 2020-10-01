import Base from '../../src/custom-elements/base.mjs';
import html from '../../src/template-v2/html.mjs';
import mount from '../../src/template-v2/mount.mjs';
import on from '../../src/template-v2/on.mjs';
import { single } from '../../src/straw-react/single.mjs';
import { use } from '../../src/straw-react/use.mjs';
import apply_expression from '../../src/template-v2/apply-expression.mjs';


export default class CalendarBasic extends Base {
	constructor() {
		super();

		// Make sure that the direction is set using whatever the language is that is used by the calendar.
		this.shadowRoot.host.setAttribute('dir', 'auto');
	}

	async run(signal) {
		this.shadowRoot.innerHTML += `
			<style>
				:root {
					display: block;
				}
				:root > svg {
					width: 100%;
				}
				.cell {
					stroke: currentColor;
				}
			</style>
		`;

		const temp = new Comment();
		this.shadowRoot.appendChild(temp);

		const ns = 'http://www.w3.org/2000/svg';
		const svg = document.createElementNS(ns, 'svg');
		svg.setAttributeNS(null, 'viewBox', '0 0 700 600');

		// Create the cells:
		for (let x = 0; x < 7; ++x) {
			for (let y = 0; y < 6; ++y) {
				const cell_container = document.createElementNS(ns, 'foreignObject');
				cell_container.setAttributeNS(null, 'x', x * 100);
				cell_container.setAttributeNS(null, 'y', y * 100);
				cell_container.setAttributeNS(null, 'width', 100);
				cell_container.setAttributeNS(null, 'height', 100);
				svg.appendChild(cell_container);
				const cell = document.createElement('div');
				cell.classList.add('cell');
				cell_container.appendChild(cell);
			}
		}

		apply_expression(svg, temp, signal);
	}
}
customElements.define('calendar-basic', CalendarBasic);

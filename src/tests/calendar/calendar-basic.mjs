import Base from '../../base.mjs';
import html from '../../html.mjs';
import on from '../../users/on.mjs';
import delay from '../../lib/delay.mjs';
import range from '../../lib/range.mjs';
import css from '../../users/css.mjs';
import mount from '../../mount.mjs';
import NEVER from '../../lib/never.mjs';
import props from '../../props.mjs';
import wrapSignal from '../../cancellation/wrap-signal.mjs';

import { DateTime, Duration, Interval } from './luxon.mjs';

function* repeat(valOrFunc, times) {
	const ret = [];
	for (let i = 0; i < times; ++i) {
		ret.push(
			valOrFunc instanceof Function ? valOrFunc() : valOrFunc
		);
	}
	return ret;
}

export default class CalendarBasic extends Base {
	get styles() {
		return css`:host {
			display: grid;
			grid-template-columns: repeat(7, 1fr);
			grid-template-areas:
				"header header header header header header header";
			grid-template-rows: auto repeat(6, auto repeat(5, max(1em, 1fr)));
			border: 1px solid #aaa;
		}
		header {
			grid-area: header;
		}
		.cells {
			display: contents;
		}
		.cell {
			box-sizing: border-box;
			grid-row: auto / span 6;
			grid-column: auto / span 1;
			display: grid;
			grid-template-rows: subgrid;
			border: 1px solid #aaa;
			border-collapse: collapse;
		}
		.cell:not(.in-month) {
			background-color: #ddd;
		}
		`;
	}
	
	*buildCells() {
		let basis = DateTime.local();
		const monthStart = basis.startOf('month');
		const visibleStart = monthStart.startOf('week');
		const monthEnd = basis.endOf('month');
		const visibleEnd = monthEnd.endOf('week');

		const month = Interval.fromDateTimes(monthStart, monthEnd);
		const visible = Interval.fromDateTimes(visibleStart, visibleEnd);
		function randInt(min, max) { return min + Math.floor(Math.random() * (max - min)); }
		function *repeat(funcOrVal, times) {
			for(let _ = 0; _ < times; ++_) {
				if (funcOrVal instanceof Function) {
					yield funcOrVal();
				} else {
					yield funcOrVal;
				}
			}
		}

		for (let i = visibleStart; visible.contains(i); i = i.plus({days: 1})) {
			yield html`
				<div class="cell ${month.contains(i) ? 'in-month' : ''}">
					${i.toLocaleString({day: 'numeric'})}
				</div>
			`;
		}
	}

	async run(abortSignal) {
		const wrap = wrapSignal(abortSignal);
		const unmount = mount(html`
			${this.styles}
			<header>
				Sample Text
			</header>
			<div class="cells">
				${[...this.buildCells()]}
			</div>
		`,
		this.shadowRoot)
		try {
			await wrap(NEVER);
		} finally {
			unmount();
		}
	}
}
customElements.define('calendar-basic', CalendarBasic);
// OLD Props: 
// props({
// 	'lang': {
// 		type: String,
// 		default: function () {
// 			// The default will only be used if we don't have a default set via attribute or property
// 			let lang;
// 			// Check for a language attribute on a DOM parent
// 			let langEl = this.matches('[lang]');
// 			if (langEl) {
// 				return langEl.getAttribute('lang');
// 			}
// 			// Use the navigator's language
// 			else {
// 				return navigator.language;
// 			}
// 		}
// 	}
// }, 
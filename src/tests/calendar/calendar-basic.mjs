// @flow

import Base from '../../base.mjs';
import html from '../../html.mjs';
import css from '../../users/css.mjs';
import mount from '../../mount.mjs';
import NEVER from '../../lib/never.mjs';
import wrapSignal from '../../cancellation/wrap-signal.mjs';
import LiveData from '../../reactivity/live-data.mjs';
import Computed from '../../reactivity/computed.mjs';

import { DateTime, Duration, Interval, Info } from './luxon.mjs';
import resizeObserve from '../../users/resize-observe.mjs';
import on from '../../users/on.mjs';
import ref from '../../users/ref.mjs';

const compareIntervals = (a, b) => a.equals(b);

export default class CalendarBasic extends Base {
	constructor() {
		super();
		// Make sure that the direction is set using whatever the language is that is used by the calendar.
		this.shadowRoot.host.setAttribute('dir', 'auto');
	}


	// TODO: Replace thise styles thing with CSS modules
	get styles() {
		return css`:host {
			direction: auto;
			display: grid;
			grid-template-columns: repeat(7, minmax(0, 1fr));
			grid-template-rows: auto auto repeat(6, auto minmax(1em, auto) minmax(1em, auto) minmax(1em, auto) minmax(1em, auto) minmax(1em, auto));
			border: 1px solid #aaa;
			border-bottom: 0;
			/*
				overflow-y: auto;
				overflow-x: hidden;
			*/
		}
		header {
			display: flex;
			align-items: baseline;
			grid-column: auto / span 7;
		}
		.title {
			order: 0;
		}
		.displayed-month {
			order: 1;
		}
		.title, .displayed-month {
			margin: 0;
		}
		.displayed-month {

		}
		.title {
			flex-grow: 1;
		}
		.weekdays {
			/* Prevent languages with multi word weekday names (like hebrew) from wrapping before attempting to use a smaller weekday name format: */
			white-space: nowrap;
			display: contents;
			text-align: center;
		}
		.weekday {

		}
		.cells {
			display: contents;
		}
		.cell {
			/* I'm using negative margins to make colloring the outline of an element easier. */
			box-sizing: border-box;
			grid-row: auto / span 6;
			border: 1px solid #aaa;
			margin: -1px -1px 0 0;
			outline: 0;
		}
		.cell.basis {
			z-index: 5;
			border-color: lime;
		}
		.cell:dir(ltr):nth-of-type(7n - 6),
		.cell:dir(rtl):nth-of-type(7n),
		/* Sadly, dir() isn't supported even in Canary so I need a js fallback that uses getComputedStyles(el).direction and applies a css class. */
		.ltr .cell:nth-of-type(7n - 6),
		.rtl .cell:nth-of-type(7n) {
			margin-left: -1px;
		}
		.cell:not(.in-month) {
			background-color: #ddd;
		}
		`;
	}
	// I would like to convert this whole LiveData + getter + setter + (attributeChangedCallback?) into a decorator setup once somebody starts supporting them. These also need to delete any attributes that have already been added by a framework before the element was upgraded + call the setter with the value they set.
	_basis = new LiveData(DateTime.local())
	_month = new Computed(basis => Interval.fromDateTimes(
		basis.startOf('month'),
		basis.endOf('month')
	), this._basis).setCompare(compareIntervals)
	_visible = new Computed(month => Interval.fromDateTimes(
		month.start.startOf('week'),
		month.end.endOf('week')
	), this._month).setCompare(compareIntervals)
	get basis() {
		return this._basis.value;
	}
	set basis(newDate) {
		this._basis.value = newDate;
		return true;
	}
	
	buildCells() {
		return (new Array(42)).fill("").map((_, i) => {
			const day = new Computed(visible => visible.start.plus({days: i}), this._visible);
			return html`<div 
					${on('keydown', e => {
						// Arrow key navigation that takes the language direction into consideration when using the left and right arrow keys.
						const {target, keyCode} = e;
						const LEFT = 37;
						const RIGHT = 39;
						const UP = 38;
						const DOWN = 40;
						const langDir = window.getComputedStyle(target).direction;
						if (keyCode == UP) {
							this.basis = day.value.plus({weeks: -1});
						} else if (keyCode == DOWN) {
							this.basis = day.value.plus({weeks: 1});
						} else if (keyCode == LEFT) {
							this.basis = day.value.plus({days: langDir == 'ltr' ? -1 : 1});
						} else if (keyCode == RIGHT) {	
							this.basis = day.value.plus({days: langDir == 'ltr' ? 1 : -1});
						} else {
							// If the keycode isn't any of the arrow keys then don't prevent default.
							return;
						}
						// I don't want the page to scroll if the up and down arrow keys are pressed.
						e.preventDefault();
					})}
					tabIndex="${new Computed((basis, day) => 
						basis.hasSame(day, 'day') ? '0' : '-1',
					this._basis, day)}" 
					class="cell 
						${new Computed((day, month) => month.contains(day) ? 'in-month' : '', day, this._month)}
						${new Computed((basis, day) => basis.hasSame(day, 'day') ? 'basis' : '', this._basis, day)}
					"
					${on('focus', _ => this.basis = day.value)}
					${ref(el => new Computed((day, basis) => {
						if (basis.hasSame(day, 'day') && el.getRootNode().activeElement) {
							el.focus();
						}
					}, day, this._basis))}
				>
					${new Computed(day => day.toLocaleString({day: 'numeric'}), day)}
				</div>
			`;
		});
	}
	buildWeekdays() {
		// MAYBE: Handle not default locale?
		// Show the weekday names and adjust between long / short / narrow based on the available space in the calendar's header.
		const types = ["long", "short", "narrow"];
		const index = new LiveData(0);
		const weekdayNames = new Computed(index => Info.weekdays(types[index]), index);
		const fits = new Map();
		const canIncrease = new Map();
		const observer = new ResizeObserver((entries, _observer) => {
			let decrease = false;
			for (const {target} of entries) {
				if (!fits.has(target)) { fits.set(target, []); canIncrease.set(target, false); }
				fits.get(target)[index.value] = target.scrollWidth;
				if (target.offsetWidth < target.scrollWidth && index.value < types.length - 1) {
					decrease = true;
				}
				canIncrease.set(target, 
					target.offsetWidth > (fits.get(target)[index.value - 1] || Infinity)
				);
			}
			if (decrease) {
				++(index.value);
			} 
			// TODO: Fix the bellow condition...
			else if ([...canIncrease.values()].every(val => val)) {
				--(index.value);
			}
		});
		return html`<div class="weekdays">
			${Info.weekdays().map((_, i) => html`
				<span class="weekday" ${resizeObserve(observer)}>
					${new Computed(names => names[i], weekdayNames)}
				</span>
			`)}
		</div>`;
	}

	async run(signal) {
		const wrap = wrapSignal(signal);
		const unmount = mount(html`
			${this.styles}
			<header>
				${/* <!-- So... I'm putting displayed-month before the title and then using flex order to switch it to title then displayed month.  This is to make sure that the dir="auto" on the main element first encounters the text of the displayed month rather than the title.  That way the direction is coherent with the language that the dates are displayed in rather than the title of the calendar.  I'm going to treat the titles, descriptions, etc as user input and wrap them in bdi tags (For support, it looks like I should do dir="auto" as well: https://caniuse.com/#search=bdi) -->*/ ""}
				<h2 class="displayed-month">
					${new Computed(basis => basis.toLocaleString({month: 'long', year: 'numeric'}), this._basis)}
				</h2>
				<h1 class="title">
					<bdi><slot name="title"></slot></bdi>
				</h1>
			</header>
			${this.buildWeekdays()}
			<div class="cells">
				${this.buildCells()}
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
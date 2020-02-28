import Base from 'custom-elements/base.mjs';
import { html, css, mount } from 'templating/def-context.mjs';
import NEVER from 'lib/never.mjs';
import wrapSignal from 'cancellation/wrap-signal.mjs';
import LiveData from 'reactivity/live-data.mjs';
import Computed, { Unchanged, diff } from 'reactivity/computed.mjs';

import { DateTime, Duration, Interval, Info } from './luxon.mjs';
import range from 'lib/range.mjs';

import resizeObserve from 'users/resize-observe.mjs';
import on from 'users/on.mjs';
import ref from 'users/ref.mjs';
import arrow_nav from 'users/arrow-nav.mjs';
import component from 'users/component.mjs';

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
			display: layout(blocklike);
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
			/* I'm using negative margins to make colloring the outline of an element easier. TODO: Replace with a paint worklet? */
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
	_month = new Computed(diff(basis => {
		if (basis.o && basis.o.startOf('month').equals(basis.n.startOf('month'))) {
			return Unchanged;
		} else {
			return Interval.fromDateTimes(
				basis.n.startOf('month'),
				basis.n.endOf('month')
			);
		}
	}), this._basis)
	_visible = new Computed(month => Interval.fromDateTimes(
		month.start.startOf('week'),
		month.end.endOf('week')
	), this._month)
	get basis() {
		return this._basis.value;
	}
	set basis(newDate) {
		this._basis.value = newDate;
		return true;
	}
	
	buildCells() {
		const cells = [];
		let last_basis;
		const updater = new Computed(diff((visible, basis) => {
			// Handle the basis changing (which must have happened if )
			if (last_basis) {
				last_basis.basis = '';
				last_basis.tabIndex = '-1';
				last_basis = false;
			}
			const basis_index = Interval.fromDateTimes(visible.n.start, basis.n).count('days') - 1;
			const new_basis = cells[basis_index];
			new_basis.basis = 'basis';
			new_basis.tabIndex = '0';
			last_basis = new_basis;

			if (visible.n !== visible.o) {
				for (const i of range(0, 42)) {
					const cell = cells[i];
					const date = visible.n.start.plus({days: i});
	
					// Add the date:
					cell.date = date.toLocaleString({day: 'numeric'});
	
					// Check if it's in the month:
					if (date.hasSame(basis.n, 'month')) {
						cell.inMonth = 'in-month';
					} else {
						cell.inMonth = '';
					}
				}
			}
			
			// This computed is only used for effects:
			return '';
		}), this._visible, this._basis);
		for (const i of range(0, 42)) {
			// TODO: Handle focusing:
			cells.push(component(prop => html`
				<div 
					tabIndex="${prop('tabIndex', '-1')}" 
					class="cell 
						${prop('inMonth', '')}
						${prop('basis', '')}
					"
					${on('focus', _ => this.basis = this._visible.value.start.plus({days: i}))}
				>
					${prop('date', '__')}
				</div>
			`));
		}
		// We put the updater computed into the array so that it get's pulled and updates the rest of the cells as long as it's bound and sinking
		cells.push(updater);
		return cells;

		return Array.from(range(0, 42)).map((_, i) => {
			const day = new Computed(visible => visible.start.plus({days: i}), this._visible);
			return html`<div 
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
		const weekdayNames = new Computed(diff(index => {
			if (index.o && index.o === index.n) {
				return Unchanged;
			} else {
				return Info.weekdays(types[index.n]);
			}
		}), index);
		const fits = new Map();
		const canIncrease = new Map();
		const observer = new ResizeObserver((entries, _observer) => {
			let working_index = index.value;
			let decrease = false;
			for (const {target} of entries) {
				if (!fits.has(target)) { fits.set(target, []); canIncrease.set(target, false); }
				fits.get(target)[working_index] = target.scrollWidth;
				if (target.offsetWidth < target.scrollWidth && working_index < types.length - 1) {
					decrease = true;
				}
				canIncrease.set(target, 
					target.offsetWidth > (fits.get(target)[working_index - 1] || Infinity)
				);
			}
			if (decrease) {
				++(working_index);
			} 
			// TODO: Fix the bellow condition so that it doesn't add another linear complexity term.
			else if ([...canIncrease.values()].every(val => val)) {
				--(working_index);
			}
			index.value = working_index; // Only update the live-data once
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
		await CSS.layoutWorklet.addModule('./month-layout.js');
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
			<div class="cells" ${arrow_nav({
				// Arrow key navigation that takes the language direction into consideration when using the left and right arrow keys.
				up: () => {
					this.basis = this.basis.plus({weeks: -1});
				},
				down: () => {
					this.basis = this.basis.plus({weeks: 1});
				},
				left: (target) => {
					const langDir = window.getComputedStyle(target).direction;
					this.basis = this.basis.plus({days: langDir == 'ltr' ? -1 : 1});
				},
				right: (target) => {	
					const langDir = window.getComputedStyle(target).direction;
					this.basis = this.basis.plus({days: langDir == 'ltr' ? 1 : -1});
				},
				space: () => {
					// TODO: Open day and view events?
				}
			})}>
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
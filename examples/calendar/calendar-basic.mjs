import Base from '../../src/custom-elements/base.mjs';
import html from '../../src/templating/html.mjs';
import mount from '../../src/templating/mount.mjs';
import NEVER from '../../src/lib/never.mjs';
import wrapSignal from '../../src/cancellation/wrap-signal.mjs';
import LiveData from '../../src/reactivity/live-data.mjs';
import Computed, { Unchanged, diff } from '../../src/reactivity/computed.mjs';

import { DateTime, Duration, Interval, Info } from './luxon.mjs';
import range from '../../src/lib/range.mjs';

import resizeObserve from '../../src/templating/users/resize-observe.mjs';
import on from '../../src/templating/users/on.mjs';
import ref from '../../src/templating/users/ref.mjs';
import arrow_nav from '../../src/templating/users/arrow-nav.mjs';
import component from '../../src/templating/users/component.mjs';

import calendar_basic_css from './calendar-basic.css.mjs';

export default class CalendarBasic extends Base {
	constructor() {
		super();
		// Make sure that the direction is set using whatever the language is that is used by the calendar.
		this.shadowRoot.host.setAttribute('dir', 'auto');
	}


	// TODO: Replace thise styles thing with CSS modules
	get styles() {
		return calendar_basic_css;
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
		// await CSS.layoutWorklet.addModule('./month-layout.js');
		const wrap = wrapSignal(signal);
		const unmount = mount(html`
			${this.styles}
			<header>
				${/* So... I'm putting displayed-month before the title and then using flex order to switch it to title then displayed month.  This is to make sure that the dir="auto" on the main element first encounters the text of the displayed month rather than the title.  That way the direction is coherent with the language that the dates are displayed in rather than the title of the calendar.  I'm going to treat the titles, descriptions, etc as user input and wrap them in bdi tags (For support, it looks like I should do dir="auto" as well: https://caniuse.com/#search=bdi) */ ""}
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
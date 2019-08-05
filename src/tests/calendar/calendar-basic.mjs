
import Base from '../../base.mjs';
import html from '../../html.mjs';
import on from '../../users/on.mjs';
import delay from '../../lib/delay.mjs';
import range from '../../lib/range.mjs';
import css from '../../users/css.mjs';
import mount from '../../mount.mjs';
import NEVER from '../../lib/never.mjs';
import props from '../../props.mjs';

export default class CalendarBasic extends props({
		'lang': {
			type: String,
			default: function () {
				// The default will only be used if we don't have a default set via attribute or property
				let lang;
				// Check for a language attribute on a DOM parent
				let langEl = this.matches('[lang]');
				if (langEl) {
					return langEl.getAttribute('lang');
				}
				// Use the navigator's language
				else {
					return navigator.language;
				}
			}
		}
	}, Base) {
	
	get styles() {
		return css`:host {
			display: grid;
			grid-template-columns: 1fr 1fr 1fr 1fr 1fr 1fr 1fr;
			grid-template-rows: 
			border: 1px solid #aaa;
		}`;
	}
	
	*run() {
		const unmount = mount(html`
			${this.styles}
			<header>

			</header>
		`,
		this.shadowRoot)
		try {
			yield NEVER;
		} finally {
			unmount();
		}
	}
}
customElements.define('calendar-basic', CalendarBasic);
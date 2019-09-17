import html from '../../html.mjs';

export default function calendarTest() {
	// Bring in the calendar-basic element
	return html`
	<h1>Custom Element Calendar</h1>
		${(async function* () {
			yield html`Importing the calendar module`;
			await import('../calendar/calendar-basic.mjs');
			yield html`Waiting for the calendar-basic element to be defined`;
			await customElements.whenDefined('calendar-basic');
			yield html`<calendar-basic></calendar-basic>`;
		})()}
	`;
}
import html from '../../html.mjs';
import css from '../../users/css.mjs';

export default function languageTesting() {
	return html`
		${css`
			textarea {
				width: 100%;
				min-height: 5em;
			}
		`}
		<p>Default:</p>
		<textarea></textarea>
		<p>[dir="rtl"]</p>
		<textarea dir="rtl"></textarea>
		<p>[dir="ltr"]</p>
		<textarea dir="ltr"></textarea>
		<p>direction: rtl;</p>
		<textarea style="direction: rtl;"></textarea>
		<p>direction: ltr;</p>
		<textarea style="direction: ltr;"></textarea>
	`;
}
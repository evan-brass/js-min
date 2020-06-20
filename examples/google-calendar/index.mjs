import html from '../../src/template-v2/html.mjs';
import on from '../../src/template-v2/on.mjs';
import sink from '../../src/template-v2/sink.mjs';
import LiveData from '../../src/reactivity/live-data.mjs';

// function counter() {
// 	const count = new LiveData(5);
// 	return html`
// 		<button ${on('click', _ => count.value -= 1)}>-</button>
// 		${async (el) => {
// 			const text = new Text();
// 			el.replaceWith(text);
// 			for await (const v of count) {
// 				text.data = v;
// 			}
// 		}}
// 		<button ${on('click', _ => count.value += 1)}>+</button>
// 	`;
// }
// document.body.appendChild(counter());
const temp = new Comment();
document.body.appendChild(temp);
sink((async function*() {
	yield html`Beginning OAuth 2.0 request with Google.  Opening auth dialog...`;
	const client_id = '178771898722-c1r69eremasui0igehgmeg95nfb758jc.apps.googleusercontent.com';
	const redirect_uri = 'https://evan-brass.github.io/js-min/examples/google-calendar/oauth-catch.html';
	const scopes = [
		'https://www.googleapis.com/auth/calendar.readonly',
		'https://www.googleapis.com/auth/calendar.events.readonly',
		'https://www.googleapis.com/auth/calendar.events',
		'https://www.googleapis.com/auth/calendar',
		'https://www.googleapis.com/auth/calendar.settings.readonly'
	];
	const auth_handle = window.open(`https://accounts.google.com/o/oauth2/v2/auth?client_id=${client_id}&redirect_uri=${redirect_uri}&response_type=token&scope=${scopes.join(' ')}`);
})())(temp);
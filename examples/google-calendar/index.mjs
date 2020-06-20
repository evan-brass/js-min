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

function single_btn(text = "") {
	let btn;
	const prom = new Promise(res => {
		btn = document.createElement('button');
		btn.innerText = text;
		btn.addEventListener('click', res, { once: true });
	});
	const func = el => {
		el.replaceWith(btn);
	};
	func.then = (...stuff) => prom.then(...stuff);
	return func;
}

const sample_token = '#access_token=ya29.a0AfH6SMAyJXXmSTdU7Q5EMSQdVrgP1461rFtfO1v_DJ4hM5QJCdtoFwdJt-NeYr1vVbXzkq56XOOFyBtEFzay6B3x5H8DHt_pYHcPbFpbRSpGqtdnGdkzFzPkXdquIDUdgV8nfAEbiqi798swlQqzyogJ8RLzN1QTBLY&token_type=Bearer&expires_in=3599&scope=https://www.googleapis.com/auth/calendar.settings.readonly%20https://www.googleapis.com/auth/calendar.events%20https://www.googleapis.com/auth/calendar.readonly%20https://www.googleapis.com/auth/calendar.events.readonly%20https://www.googleapis.com/auth/calendar';


// OAuth info:
const client_id = '178771898722-c1r69eremasui0igehgmeg95nfb758jc.apps.googleusercontent.com';
const redirect_uri = 'https://evan-brass.github.io/js-min/examples/google-calendar/oauth-catch.html';
const scopes = [
	'https://www.googleapis.com/auth/calendar.readonly',
	'https://www.googleapis.com/auth/calendar.events.readonly',
	'https://www.googleapis.com/auth/calendar.events',
	'https://www.googleapis.com/auth/calendar',
	'https://www.googleapis.com/auth/calendar.settings.readonly'
];

const temp = new Comment();
document.body.appendChild(temp);
sink((async function*() {
	const get_token = new Promise((resolve, reject) => {
		const channel = new BroadcastChannel('google-auth');
		channel.onmessage = e => {
			if (e.data) {
				resolve(e.data);
			} else {
				reject(new Error('Oauth-catch got an error.'));
			}
		};
	});

	// Get user click:
	const login_btn = single_btn('Click to Login');
	yield html`Beginning OAuth 2.0 request with Google.  ${login_btn}`;
	await login_btn;
	window.open(`https://accounts.google.com/o/oauth2/v2/auth?client_id=${client_id}&redirect_uri=${redirect_uri}&response_type=token&scope=${scopes.join(' ')}`);

	// Wait for the token to be received:
	yield html`Waiting for auth token from redirect page...`;
	const received_token = await get_token;

	yield html`Got token! ${JSON.stringify(received_token)}`;
})())(temp);
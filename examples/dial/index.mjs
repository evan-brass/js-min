/* eslint-disable indent */
import mount from '../../src/templating/mount.mjs';
import on_mult from '../../src/templating/users/on-mult.mjs';
import html from '../../src/templating/html.mjs';
import range from '../../src/lib/range.mjs';
import LiveData from '../../src/reactivity/live-data.mjs';
import Subject from '../../src/lib/subject.mjs';
import delay from '../../src/lib/delay.mjs';

function dial(
	title = 'Some Clue',
	secretMessage = 'This is secret',
	symbols = Array.from(range(0, 10)),
	passcode = [1, 2, 3, 4]
) {
	const scrollDiffs = new Subject();
	const last_location = new Map();
	return html`
		<section class="dial-container" ${on_mult({
			// These events are used to turn the dial:
			'wheel': e => {
				// const Scaler = .5;
				// scrollDiffs.yield(e.deltaY * Scaler);
				const Scaler = 3.5;
				const direction = Math.max(-1, Math.min(1, e.deltaY));
				scrollDiffs.yield(direction * Scaler);
				// e.preventDefault();
			},
			'touchstart': e => {
				for (const touch of e.changedTouches) {
					last_location.set(touch.identifier, touch.clientY);
				}
				e.preventDefault();
			},
			'touchmove': e => {
				let diff = 0;
				for (let touch of e.changedTouches) {
					diff += touch.clientY - last_location.get(touch.identifier);
					last_location.set(touch.identifier, touch.clientY);
				}
				scrollDiffs.yield(diff);
				e.preventDefault();
			},
			'touchend': e => {
				for (const touch of e.changedTouches) {
					last_location.delete(touch.identifier);
				}
				e.preventDefault();
			}
		})}>
		<h1>${title}</h1>
		<div class="marker">^</div>
		${(async function* () {
			const degrees = new LiveData();
			degrees.value = 0;
			const digits = passcode.map(_ => new LiveData());
			const digit_status = new LiveData();
			const secret_container = new LiveData();

			yield html`
				<div class="dial" style="transform: rotate(-${degrees}deg)">
					${symbols.map((sym, i) =>
						html`<span style="transform: translateX(-50%) rotateZ(${(i) * 360 / symbols.length}deg);">${sym}</span>`
					)}
				</div>
				<div class="digits ${digit_status}">${digits.map(num =>
					html`<span>${num}</span>`
				)}</div>
				<div>
					${secret_container}
				</div>
			`;
			function normalize_degrees(degrees) {
				// Normalize degrees from any number to an integer between [0, 360)
				return ((degrees % 360) + 360) % 360;
			}
			function degrees_to_symbol(degrees) {
				return symbols[Math.round(normalize_degrees(degrees) * symbols.length / 360) % symbols.length];
			}

			// Behavior:
			let last_diff;

			// Attempt to enter the password
			passcode_enter:
			// eslint-disable-next-line no-constant-condition
			while (true) {
				// TODO: This logic is not completely correct / doesn't behave exactly the way that I want.  Specifically when changing directions.
				for (const digit of digits) {
					// For every difference from the scroll wheel or touches:
					for await (const diff of scrollDiffs) {
						degrees.value = normalize_degrees(degrees.value + diff);
						if (last_diff === undefined) {
							last_diff = diff;
						}
						if ((last_diff < 0 && diff > 0) || (last_diff > 0 && diff < 0)) {
							// Check if we changed directions and should advance to the next digit
							last_diff = diff;
							break;
						} else {
							digit.value = degrees_to_symbol(degrees.value);
							if (digits.every((digit, i) => passcode[i] == digit.value)) {
								// Check if the passcode is correct:
								break passcode_enter;
							}
						}
					}
				}
				// If we used all the digits and got it wrong then change the digit container class:
				digit_status.value = 'wrong';
				// Apply a penalty time:
				await delay(950);
				// Clear the digits:
				digits.forEach(digit => digit.value = '');
				// Clear the digits container class to nothing
				digit_status.value = '';
			}
			// Passcode is correct.  Change to confirmation class on the digit container:
			digit_status.value = 'correct';
			// Display the secret message
			secret_container.value = secretMessage;
		})()}
		<link rel="stylesheet" href="./dial.css"></style>
	</section>
	`;
}

mount(dial(), document.body);
import html from '../../src/templating/html.mjs';
import mount from '../../src/templating/mount.mjs';
import { use_later } from '../../src/reactivity/use.mjs';
import single from '../../src/reactivity/single.mjs';
import on from '../../src/templating/on.mjs';

import init, { render } from './wasm/mandelbrot.js';

function mandelbrot() {
	const iterations = single(30);
	const resolution = single(1000)
	const scale = single(1);
	const x_center = single(0);
	const y_center = single(0);
	function control(title, val, opts = {}) {
		return html`<tr>
			<td>${title}</td>
			<td>
				<input type="number"
					${use_later(el => { el.value = val.value; }, true)}
					${on('change', e => {
						val.value = e.target.valueAsNumber;
					})}
					${el => {
						for (const key in opts) {
							el[key] = opts[key];
						}
					}}
				>
			</td>
		</tr>`
	}
	let canvas, ctx;
	return html`
		<details open>
			<summary>Controls</summary>
			<table>
				${control("Iterations", iterations, { step: 5, min: 0 })}
				${control("Resolution", resolution, { step: 100, min: 100 })}
				${control("Scale", scale, { min: 0 })}
				${control("X Center", x_center, { min: -2, max: 2 })}
				${control("Y Center", y_center, { min: -2, max: 2 })}
			</table>
			<button ${on('click', () => {
				const a = document.createElement('a');
				a.href = canvas.toDataURL();
				a.setAttribute('download', 'mandelbrot');
				a.click();
			})}>Download</button>
		</details>
		<canvas ${on('wheel', e => {
			scale.value += e.deltaY * 0.001 * scale.value;
		})} 
		${(el, signal) => {
			canvas = el; // Used for saving
			ctx = canvas.getContext('2d');

			let x = 0;
			let y = 0;
			let moving = false;
			on('mousedown', e => {
				moving = true;
				x = e.offsetX;
				y = e.offsetY;
			})(el, signal);
			on('mousemove', e => {
				if (moving) {
					x_center.value += (x - e.offsetX) * scale.value * 0.01;
					y_center.value += (e.offsetY - y) * scale.value * 0.01;
					x = e.offsetX;
					y = e.offsetY
				}
			})(el, signal);
			on('mouseup', e => {
				moving = false;
			})(el, signal);
		}}
		${use_later(el => {
			const res = resolution.value;

			el.width = res;
			el.height = res;

			let buffer = render(res, x_center.value, y_center.value, scale.value, iterations.value);

			ctx.putImageData(new ImageData(new Uint8ClampedArray(buffer), res, res), 0, 0);
		}, true)}>
			Canvas isn't supported.
		</canvas>
	`;
}

init().then(() => {
	mount(html`
		<style>
			body, html {
				margin: 0;
			}
			details {
				position: absolute;
				background-color: hsl(0deg 0% 100% / 42%);
				padding: 0.3em;
			}
			canvas {
				max-width: 100vw;
				max-height: 100vh;
				display: block;
				margin: auto;
			}
		</style>
		${mandelbrot()}
	`, document.body);
});
import html from '../../html.mjs';
import LiveData from '../../reactivity/live-data.mjs';
import Computed from '../../reactivity/computed.mjs';
import on from '../../users/on.mjs';

export default function homework(){
	const address = new LiveData();
	address.value = 0;
	const binary = new Computed(a => a.toString(2).padStart(32, '0'), address);
	const tag = new Computed(b => b.slice(0, 21), binary);
	const index = new Computed(b => b.slice(21, 26), binary);
	const offset = new Computed(b => b.slice(26), binary);
	return html`
		<input type="number" ${on('input', e => address.value = e.target.valueAsNumber || 0)}><br>
		Binary: 
			<span style="color: red;">${tag}(${new Computed(n => Number.parseInt(n, 2), tag)})</span>
			<span style="color: green;">${index}(${new Computed(n => Number.parseInt(n, 2), index)})</span>
			<span style="color: blue;">${offset}(${new Computed(n => Number.parseInt(n, 2), offset)})</span><br>
		Block Address: ${new Computed(a => Math.floor(a / 128), address)}<br>
		Block's First Byte Address: ${new Computed(a => {
			const fb = a & ~0b111111
			return `${fb.toString(2).padStart(32, '0')}(${fb})`;
		}, address)}<br>
		Block ID in Cache: ${new Computed(a => Math.floor(a / 128) % 32, address)}
	`;
}
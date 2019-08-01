import html from '../../html.mjs';
import LiveData from '../../lib/live-data.mjs';
import on from '../../users/on.mjs';

export default function homework(){
	const address = new LiveData();
	address.value = 0;
	async function* ag_map(iteration, func) {
		for await(const val of iteration) {
			yield func(val);
		}
	}
	function split(iteration, initial) {
		const ld = new LiveData();
		ld.value = initial;
		(async () => {
			// Run
			for await(const value of iteration) {
				ld.value = value;
			}
		})();
		return ld;
	}
	const binary = split(ag_map(address, a => a.toString(2).padStart(32, '0')), '0'.repeat(32));
	const tag = split(ag_map(binary, b => b.slice(0, 21)));
	const index = split(ag_map(binary, b => b.slice(21, 26)), '0'.repeat(5));
	const offset = split(ag_map(binary, b => b.slice(26)));
	return html`
		<input type="number" ${on('input', e => address.value = e.target.valueAsNumber || 0)}><br>
		Binary: 
			<span style="color: red;">${tag}(${ag_map(tag, n => Number.parseInt(n, 2))})</span>
			<span style="color: green;">${index}(${ag_map(index, n => Number.parseInt(n, 2))})</span>
			<span style="color: blue;">${offset}(${ag_map(offset, n => Number.parseInt(n, 2))})</span><br>
		Block Address: ${ag_map(address, a => Math.floor(a / 128))}<br>
		Block's First Byte Address: ${ag_map(address, a => {
			const fb = a & ~0b111111
			return `${fb.toString(2).padStart(32, '0')}(${fb})`;
		})}<br>
		Block ID in Cache: ${ag_map(address, a => Math.floor(a / 128) % 32)}
	`;
}
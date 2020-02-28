export default function differed() {
	let resolve, reject;
	const prom = new Promise((res, rej) => {
		resolve = res;
		reject = rej;
	});
	prom.res = resolve;
	prom.rej = reject;
	return prom;
}
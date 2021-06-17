export function* enumerate(inner) {
	let i = -1;
	for (const item of inner) {
		yield [++i, item];
	}
}
// Zip two arrays together:
export default function* zip(a, b) {
	if (a.length !== b.length) {
		throw new Error('Cannot zip arrays of different length.');
	}
	for (let i = 0; i < a.length; ++i) {
		yield [a[i], b[i]];
	}
}

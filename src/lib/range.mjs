export default function* range(start, end, step) {
	if (!step) {
		step = (end - start > 0) ? 1 : -1;
	}
	for (let i = start; (step > 0) ? i < end : i > end; i += step) {
		yield i;
	}
}
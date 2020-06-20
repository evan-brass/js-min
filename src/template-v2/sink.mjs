export default function sink(source) {
	return async function (el) {
		const before = new Text();
		const after = new Text();
		el.replaceWith(before, after);
		for await (const val of source) {
			while (before.nextSibling != after) before.nextSibling.remove();
			before.parentNode.insertBefore(val, after);
		}
	}
}
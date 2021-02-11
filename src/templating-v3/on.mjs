import ref from './ref.mjs';

export default function on(event, handler, options = {}) {
	return ref(el => {
		el.addEventListener(event, handler, options);
	});
}
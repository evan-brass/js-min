export default function ref(obj, key) {
	return (target_el, signal) => {
		obj[key] = target_el;
		signal.addEventListener('abort', () => obj[key] = undefined);
	};
}
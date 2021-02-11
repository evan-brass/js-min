export default function set_text(func) {
	return (el, signal) => {
		const text = new Text();
		el.replaceWith(text);
		signal.addEventListener('abort', () => text.replaceWith(new Comment()));
		
		func(function update_text(new_data) {
			text.data = new_data;
		}, signal);
	}
}
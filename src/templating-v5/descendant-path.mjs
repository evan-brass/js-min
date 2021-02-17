export function get_path(stack) {
	const path = [];
	for (const frame of stack) {
		if (frame.child_index === undefined) {
			break;
		}
		path.push(frame.child_index);
	}
	return path;
}

export function compile_paths(paths) {
	// TODO: Join common prefixes into variables

	const body = `return [${paths.map(path =>
		`root${path.map(index => `.childNodes[${index}]`).join('')}`
	).join(', ')}];`;
	return new Function('root', body);
}

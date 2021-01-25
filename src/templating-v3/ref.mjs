import {apply_path} from './template-builder.mjs';

export default function ref(func) {
	return builder => {
		const path = builder.decendent_path();
		builder.add_init(root => {
			const el = apply_path(root, path);
			func(el);
		});
	}
}
import ref from './ref.mjs';

export default function placeholder(func) {
	return builder => {
		builder.move("<!--");
		ref(func)(builder);
		builder.move("-->");
	};
}
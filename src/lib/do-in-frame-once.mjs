// @flow

const AFHandles = new Map();

export default function doInFrameOnce(key, func) {
	if (!AFHandles.has(key)) {
		AFHandles.set(key, requestAnimationFrame(() => {
			AFHandles.delete(key);
			func();
		}));
	}
}
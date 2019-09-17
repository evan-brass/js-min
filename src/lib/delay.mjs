import Differed from './differed.mjs';
import { CancellationError } from './cancellable.mjs';

export default function delay(ms) {
	const diff = new Differed();
	let handle = setTimeout(_ => diff.resolve(true), ms);
	diff.cancel = _ => {
		clearTimeout(handle);
		diff.reject(new CancellationError());
	};
	return diff;
}
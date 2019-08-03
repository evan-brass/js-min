import Future from '../future.mjs';
import Differed from './differed.mjs';

export default function delay(ms) {
	return new Future((function*() {
		const diff = new Differed();
		let handle;
		try {
			handle = setTimeout(_ => diff.resolve(true), ms);
			yield diff;
		} finally {
			clearTimeout(handle);
		}
	})());
}
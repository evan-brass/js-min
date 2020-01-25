// @flow

export default function differed/*:: <T>*/()/*:{
	promise: Promise<T>,
	resolve: (arg: T) => void,
	reject: (arg: any) => void
}*/ {
	const func = arg => undefined; // Satisfy typing to make resolve and reject initialized
	let resolve = func;
	let reject = func;
	const promise = new Promise((res, rej) => {
		resolve = res;
		reject = rej;
	});
	return {
		promise, 
		resolve, 
		reject
	};
}
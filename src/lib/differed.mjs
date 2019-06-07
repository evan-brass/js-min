// Stolen from: https://github.com/ljharb/promise-deferred/blob/master/index.js
export default class Differed{
    constructor() {
        // TODO: Handle calling resolve before the promise's microtask runs
        this.promise = new Promise((resolve, reject) => {
            this.resolve = resolve;
            this.reject = reject;
        });
    }
}
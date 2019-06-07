import Differed from "./differed.mjs";

export default class subject {
    constructor() {
        this.differed = false;
    }
    yield(val) {
        if (this.differed) {
            this.differed.resolve({type: 'yield', val});
        }
    }
    return(val) {
        if (this.differed) {
            this.differed.resolve({type: 'return', val});
        }
    }
    throw(val) {
        if (this.differed) {
            this.differed.resolve({type: 'throw', val});
        }
    }
    async *[Symbol.asyncIterator]() {
        while (true) {
            this.differed = new Differed();
            const message = await this.differed.promise;
            switch(message.type) {
                case 'yield':
                    yield message.val;
                    break;
                case 'return':
                    return message.val;
                case 'throw':
                    throw message.val;
                default:
                    throw new Error("Unknown type");
            }
        }
    }
}
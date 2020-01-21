// @flow

export default class Part {
    constructor(type, element) {
        this.type = type;
        this.element = element;
    }
    update(_value) {
        throw new Error("Update should be overriden.");
    }
    clear() {
        throw new Error("Clear should be overriden.");
    }
}
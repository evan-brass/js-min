export default class Part {
    constructor(type, element) {
        this.type = type;
        this.element = element;
    }
    update() {
        throw new Error("Update should be overriden.");
    }
}
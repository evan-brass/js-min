import Trait from '../../lib/trait.mjs';

export default new Trait("User", {
    acceptTypes: new Set(),
    bind(_part) {
        throw new Error("User: No default implementation for bind.");
    },
    unbind(_part) {
        throw new Error("User: No default implementation for unbind.")
    }
});
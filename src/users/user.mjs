import Trait from '../lib/trait.mjs';

export default new Trait("Object must implement the User interface as described here: https://github.com/evan-brass/js-min/wiki/Trait:-Part-User", {
    acceptTypes: new Set(),
    bind(_part) {
        throw new Error("User: No default implementation for bind.");
    },
    unbind(_part) {
        throw new Error("User: No default implementation for unbind.")
    }
});
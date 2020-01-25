// @flow

import Trait from '../lib/trait.mjs';

/*::
interface User {
	
}
*/

export default new Trait("User", {
    acceptTypes: new Set(), // The acceptTypes parameter is for dynamic type checking to make sure that this user can work with the part that it get's used with.
    bind(_part) {
        throw new Error("User: No default implementation for bind.");
    },
    unbind(_part) {
        throw new Error("User: No default implementation for unbind.")
    }
});
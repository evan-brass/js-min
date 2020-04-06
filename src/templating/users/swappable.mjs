import Trait from '../../lib/trait.mjs';

// Swapping is something that some part owners and some users support.  Essentially, the owner can check if the current user is able to swap with the new user that is going to take over that part. If it can then doSwap should do something that would be equivelent to the unbind and bind that the owner would have done.  Currently, template instances are the only swappable users.
export default new Trait('Swappable', {
	canSwap(_newUser) {
		throw new Error('CanSwap has no default implementation.');
	},
	doSwap(_newUser) {
		throw new Error('DoSwap has no default implementation.');
	}
});
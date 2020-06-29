import Trait from '../lib/trait.mjs';

const PartHandler = new Trait('PartHandler: This object has a PartHandler method.');
export default PartHandler;

// TODO: Probably also need a swapping trait.

// Format of a PartHandlerFunction:
const _sample = {
	[PartHandler](target_node, signal) {
		target_node; // This is the element that the part is referring to.  For node parts, this is a comment node at the right position in the tree.  For attribute parts, this is a reference to the node that the attribute was created on.
		signal; // This is an AbortSignal for when you should remove your hooks from this element / part.  I tested on Chrome and the event handlers created on a signal will fire at the same point in the code that the abortController's .abort() method is called.  This means that we should call .abort() and then cleanup the part (if there's any cleanup to be done).  This allows a part to be reused by multiple handlers - this is useful in async generators and in general when pooling these fragments.
	}
}
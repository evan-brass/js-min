import Trait from '../lib/trait.mjs';

export default new Trait('Reactor', {
	// The depth of a reactor determines when it should be updated to ensure that all of it's dependencies have been updated before it is updated.  The dependency graph is a directed acyclic graph.  
	// The depth should always be Math.max(...dependencies.map(d => d.depth)) + 1;
	depth: 0
});
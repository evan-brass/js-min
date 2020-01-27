import Trait from 'lib/trait.mjs';

const propagation = new Map();
let propagationEnd = 0;
let currentDepth = -1;

function startPropagation() {
	// Start running through the propagation map in a microtask so that any changes get grouped together.
	currentDepth = 0;
	Promise.resolve().then(_ => {
		for (; currentDepth <= propagationEnd; ++currentDepth) {
			for (const node of propagation.get(currentDepth) || []) {
				node.update();
			}
			propagation.delete(currentDepth);
		}
		// Reset everything for the next propagation:
		propagationEnd = 0;
		currentDepth = -1;
	});
}
export function addDependents(dependents) {
	for (const dependent of dependents) {
		// Throw an error if someone is misreporting their depth
		if (dependent.depth <= currentDepth) {
			console.warn(new Error(`Attempted to add dependencies with a depth we've already propagated.`));
		}

		// Correct propagationEnd while adding dependents
		propagationEnd = Math.max(propagationEnd, dependent.depth);
		
		// MAYBE: Set a propagationStart instead of always starting to propagate from 0?
		
		// Add the dependents.
		if (!propagation.has(dependent.depth)) {
			propagation.set(dependent.depth, new Set());
		}
		propagation.get(dependent.depth).add(dependent);
	}

	// If we haven't already started propagating then start a propagation in a microtask.
	if (currentDepth == -1) {
		startPropagation();
	}
}
export const Reactive = new Trait('Reactive');
Reactive.implementation = class {
	dependents = new Set()
	// All nodes need these props / methods:

	// Depth should never be set to (by anyone outside the node)
	get depth() {
		throw new Error('No default implementation for the depth getter.');
	}
	// Value won't be settable in most nodes.  Base nodes (depth 0) are probably the only nodes that will be settable.  People should only call value after becoming a dependent of the node.
	get value() {
		throw new Error('No default implementation for the value getter.');
	}
	depend(dependent) {
		this.dependents.add(dependent);
	}
	undepend(dependent) {
		this.dependents.delete(dependent);
	}
	get [Reactive]() { return this; }

	// Nodes that aren't depth 0 need the following methods:
	
	// Update depth is so that if a node adds and removes dependencies then people who depend on it can have the most up to date depth
	// Actually, I've been thinking that it might make more sense to not have an update depth, if you have variable dependencies then maybe you should just be outside the normal graph and receive updates.
	updateDepth(_changedDependency) {
		throw new Error('No default implementation for the depth change handler.');
	}
	update() {
		throw new Error('No default implementation for the updater.');
	}

	// This is an optional method that is useful to the classes that extend this implementation
	propagate() {
		addDependents(this.dependents);
	}
};
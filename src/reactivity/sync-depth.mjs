// @flow

// Current depth is the layer in the dependency graph that we are currently running.
let currentDepth = false;
let layerWaiters = [];
let nextReaction = false;

function* reaction() {
	// While one reaction is propagating, another reaction could be started.  Apply the first to completion and then start back over until there are no more reactions
	while (layerWaiters.length) {
		console.log(`Starting to react from depth ${currentDepth}`);
		// For each layer in increasing depth...
		for (; currentDepth < layerWaiters.length; ++currentDepth) {
			console.log(`Propagating depth ${currentDepth}`);
			// Run all the callbacks...
			const callbacks = layerWaiters[currentDepth];
			if (callbacks !== undefined) {
				for (const callback of callbacks) {
					callback();
				}
			}
			// And clear that layer
			delete layerWaiters[currentDepth];

			yield; // Pause after each layer
		}
		// Only start propagating from the earliest node that changed.
		currentDepth = nextReaction;
		nextReaction = false;
		for (let i = layerWaiters.length - 1; i >= 0; --i) {
			if (layerWaiters[i] === undefined) layerWaiters.pop();
			else break;
		}
	}
	currentDepth = false;
	nextReaction = false;
}

function startReaction() {
	const inst = reaction();

	// Since microtasks are already taken for reactivity by the async generators, we need to use timeouts...
	function handler() {
		const {done} = inst.next();
		if (!done) setTimeout(handler, 0);
	};
	setTimeout(handler, 0);
}

export default function syncDepth(depth, issuerDepth) {
	if (currentDepth === false) {
		currentDepth = issuerDepth
		startReaction();
	} else if (issuerDepth < currentDepth) {
		// The next time we propagate we need to start at least at issuer depth
		if (!nextReaction || nextReaction > issuerDepth) {
			nextReaction = issuerDepth;
		}
		console.warn(new Error(`A reaction was started during another reaction.  This could mean that multiple reactions were triggered but it also could mean that the nodes of the dependency graph are misreporting their depth.`));
	}
	return {
		then(callback, _errCallback) {
			if (!layerWaiters[depth]) {
				layerWaiters[depth] = [];
			}
			layerWaiters[depth].push(callback);
		}
	};
}
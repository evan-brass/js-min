import NodePart from './node-part.mjs';
import AttributePart from './attribute-part.mjs';
import AttributeValuePart from './attribute-value-part.mjs';

export default function *createParts(commentNode) {
	let parsed;
	try {
		// MAYBE: Maybe find a better way of determining if it's JSON or not.
		parsed = JSON.parse(commentNode.data);
	} catch(e) {
		// If the Comment's data isn't JSON parsable, then it's not ours.
		if (e instanceof SyntaxError) return;
		// MAYBE: Check the syntax error to make sure that it's due to the contents not being JSON, and not some other SyntaxError.
		// If it's something other than a Syntax Error then don't catch it.
		else throw e;
	}
	// TODO: Handle if the comment's contents is JSON but isn't one of our parts
	if (parsed.type == undefined) {
		// Must be an object with Attribute parts
		for (const part of parsed.parts) {
			// Might be able to be just nextSibling, but I think nextElementSibling is safer
			const element = commentNode.nextElementSibling;
			if (part.sharedIndex != undefined) {
				yield new AttributeValuePart(element, part.attrName, parsed.shared[part.sharedIndex], part.index);
			} else {
				yield new AttributePart(element);
			}

		}
		commentNode.remove();
	} else if (parsed.type == 'node') {
		yield new NodePart(commentNode);
	}
}
import sha1 from "lib/string-hash.mjs";
import convertMarkers from "parts/convert-markers.mjs";

const TemplateCache = new Map();

const appendTemplates = document.createElement('template');
appendTemplates.id = "generated-templates";
document.body.appendChild(appendTemplates);

// Load any pregenerated templates
const pregeneratedHolder = document.getElementById('pregenerated-templates');
if (pregeneratedHolder) {
	for (const template of pregeneratedHolder.content.children) {
		registerTemplate(template.id, template, true);
	}
}

export function createTemplate(id, strings) {
	function joinStrings(strings, markers) {
		let composed = "";
		for (let i = 0; i < strings.length - 1; ++i) {
			const str = strings[i];
			composed += str + markers.next().value;
		}
		composed += strings[strings.length - 1];
		return composed;
	}
	function *markers(id) {
		for (let order = 0; true; ++order) {
			yield `${id}-${order}`;
		}
	}
	const template = document.createElement('template');
	if (appendTemplates) {
		appendTemplates.content.appendChild(template);
	}
	template.id = id;
	template.innerHTML = joinStrings(strings, markers(id));

	convertMarkers(template, id);

	return template;
}
export function registerTemplate(id, template, pregenerated = false) {
	TemplateCache.set(id, template);
}

export async function createId(strings) {
	// Always start the id with a character so that it is valid everywhere in HTML.
	return 'a' + await sha1(strings.join('{{}}'));
}

export function getTemplate_id(id) {
	if (TemplateCache.has(id)) {
		return TemplateCache.get(id);
	} else {
		throw new Error("Template wasn't registered before requesting it.");
	}
}

const idCache = new WeakMap();

export async function getTemplate(strings) {
	if (!(strings instanceof Array)) {
		throw new Error("Argument to createTemplate must be an Array of strings like that produced by a tagged template litteral.");
	}
	let id = idCache.get(strings);
	if (!id) {
		id = await createId(strings);
		idCache.set(strings, id);
	}
	if (TemplateCache.has(id)) {
		return TemplateCache.get(id);
	} else {
		const template = createTemplate(id, strings)
		registerTemplate(id, template);
	
		return template;
	}
}
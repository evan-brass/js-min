const encoder = new TextEncoder();

export default async function sha1(str) {
	const string_buffer = encoder.encode(str);
	const hash_buffer = await crypto.subtle.digest('SHA-1', string_buffer);
	// TODO: Performance analysis between Uint8Array and the other typed arrays.  I imagine that using a higher number means shorter length with less string concatenation.
	let hash = new Uint8Array(hash_buffer).reduce((hash, item) => hash + item.toString(16).padStart(2, '0'), "");
	return hash;
};
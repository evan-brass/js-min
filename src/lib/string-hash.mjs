const encoder = new TextEncoder();

export default async function sha1(str) {
	const string_buffer = encoder.encode(str);
	const hash_buffer = await crypto.subtle.digest('SHA-1', string_buffer);
	let hash = new Uint8Array(hash_buffer).reduce((hash, item) => hash + item.toString(16).padStart(2, '0'), "");
	return hash;
};
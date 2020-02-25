// Stolen from https://github.com/mozilla-services/WebPushDataTestPage/blob/gh-pages/common.js
export function toUrlBase64(data) {
	/* Convert a binary array into a URL safe base64 string
	*/
	return btoa(data)
		.replace(/\+/g, "-")
		.replace(/\//g, "_")
		.replace(/=/g, "")
}

export function fromUrlBase64(data) {
	/* return a binary array from a URL safe base64 string
	*/
	return atob((data + "====".substr(data.length % 4))
		.replace(/\-/g, "+")
		.replace(/\_/g, "/"));
}
export function strToArray(str) {
	/* convert a string into a ByteArray
	 *
	 * TextEncoders would be faster, but have a habit of altering
	 * byte order
	 */
	let split = str.split("");
	let reply = new Uint8Array(split.length);
	for (let i in split) {
		reply[i] = split[i].charCodeAt(0);
	}
	return reply;
}
export function arrayToStr(array) {
	/* convert a ByteArray into a string
	 */
	return String.fromCharCode.apply(null, new Uint8Array(array));
}

// Except for the stuff bellow:
export function build_buffer(template) {
	const total = template.reduce((acc, item) => 
		acc + (Number.isInteger(item) ? item : item.byteLength),
	0);
	const buffer = new Uint8Array(total);
	let offset = 0;
	for (const item of template) {
		if (!Number.isInteger(item)) {
			buffer.set(item, offset);
			offset += item.byteLength;
		} else {
			offset += item;
		}
	}
	return buffer;
}

import { toUrlBase64, arrayToStr, build_buffer } from "./common.mjs";

/**
 * Max message is 4094 (4KB - 2 bytes for the padding length)
 * 
 * A signature length of 0 is reserved for future, unsigned, messages.
 * The type of 0 is reserved.
 * the I-Am of 0 is reserved.
 * The endianness isn't important for the I-Am value: I-Am is a category not a number.  
 * I-Am is used to help with identify who sent the message though multiple peers can have the same I Am.
 * To mitigate Denial of Service attacks, a peer may choose to have a limited number of peers allowed to share an I Am.  In that case, your introduction might be ignored.  If you can't get connected with someone, you might try connecting using a different I Am.  You should randomly choose an I-Am before introducing yourself to a node and then use the same I-Am for Push-Info / Push-authorization messages afterwards.  Public nodes that can have multiple subscriptions wouldn't need any of the signing and I-Am because each peer that they connect with would have a different push endpoint.  These peers would still need to check them though because a peer might have shared their push-info and authorization with that peer so that they could introduce themselves.  In that case, the peer would send back a new push-info message so that they use the new subscription for future signaling.
 * Signature hash algorithm is SHA-256
 * Peer Keys are ECDSA on the P-256 curve
 * Endpoint, JWT, SDP Description, and ICE Candidate are all UTF-8 encoded
 * 
 * +--------1---------+-----------+--2---+--1---+
 * | Signature Length | Signature | I Am | Type |
 * +------------------+-----------+------+------+
 *                                       +------+-----1------+-----------------+
 * Introduction:                         |  01  | Key Length | Peer Public Key |
 *                                       +------+------------+-----------------+
 *                                       +------+------------+---------------+--16--+----------+
 * Push Info:                            |  02  | Key Length | Push Pub. Key | Auth | Endpoint |
 *                                       +------+------------+---------------+------+----------+
 *                                       +------+------------+---------------------+-----+
 * Push Authorization:                   |  03  | Key Length | App Server Pub. Key | JWT |
 *                                       +------+------------+---------------------+-----+
 *                                       +------+------------+----------------------+
 * Push Long Authorization:              |  06  | Key Length | App Server Priv. Key |
 * - TODO: Add public key too            +------+------------+----------------------+
 *                                       +------+-----------------+
 * SDP Description:                      |  04  | SDP Description |
 *                                       +------+-----------------+
 *                                       +------+---------------+
 * ICE Candidate:                        |  05  | ICE Candidate |
 *                                       +------+---------------+
 * TODO: Request I Am change
 */
const type_codes = {
	introduction: 1,
	push_info: 2,
	push_auth: 3,
	push_long_auth: 6,
	sdp: 4,
	ice: 5
};

const decoder = new TextDecoder('UTF-8', {
	fatal: true
});

// TODO: Handle invalid messages.  I'm hoping that the typed array buffers will fail if they are past the length of the buffer.
export async function parse_message(arr_buf) {
	const data = new Uint8Array(arr_buf);
	let index = 0;

	// Signature length:
	if (data.length == 0 || data[index] == 0) {
		throw new Error("Invalid message format: 0 signature length");
	}
	const sig_len = data[index++];
	const signature = new Uint8Array(data, index, sig_len);
	index += sig_len;

	// Contents: Everything after the signature (including message type):
	const contents = new Uint8Array(data, index);

	// Most messages will use this i_am
	const i_am = (new DataView(data, index, 2)).getUint16(0);
	index += 2;

	// Message type
	const type = data[index++];

	// These values are always present on a decoded message:
	const base = {
		i_am,
		signature,
		contents,
	};

	// Handle SDP and ICE before the others because these two don't have key's in them
	if (type == type_codes.sdp) {
		const sdp_buf = new DataView(data, index);
		const sdp = decoder.decode(sdp_buf);
		return Object.assign(base, {
			type: 'sdp',
			sdp
		});
	}
	if (type == type_codes.ice) {
		const ice_buf = new DataView(data, index);
		const ice = decoder.decode(ice_buf);
		return Object.assign(base, {
			type: 'ice',
			ice
		});
	}

	// The rest of the message types have a key next:
	const key_len = data[index++];
	const key_buf = new DataView(data, index, key_len);
	index += key_len;
	const importKey = async (options, uses) => await crypto.subtle.importKey(
		'raw', 
		key_buf, 
		options, 
		true, 
		uses
	);

	// Introduction:
	if (type == type_codes.introduction) {
		return Object.assign(base, {
			type: 'introduction',
			peer_key: await importKey(
				{	name: 'ECDSA',
					namedCurve: 'P-256'
				}, 
				['verify']
			)
		});
	}

	// Push Info:
	if (type == type_codes.push_info) {
		const auth = new Uint8Array(data, index, 16);
		index += 16;
		const endpoint_buf = new DataView(data, index);
		const endpoint = decoder.decode(endpoint_buf);
		return Object.assign(base, {
			type: 'push-info',
			public_key: importKey(
				{	name: 'ECDH',
					namedCurve: 'P-256'
				}, 
				[] // No uses I guess... It is combined with the message key to get a shared encryption secret.
			),
			auth,
			endpoint
		});
	}

	// Push Auth:
	if (type == type_codes.push_auth) {
		const jwt_buf = new DataView(data, index);
		const jwt = decoder.decode(jwt_buf);
		return Object.assign(base, {
			type: 'push-auth',
			app_key_encoded: toUrlBase64(arrayToStr(key_buf)),
			jwt
		});
	}

	// Just Error out on push Auth Long
	if (type == type_codes.push_long_auth) {
		throw new Error("Unimplemented");
	}

	// Throw an error for any other message types
	throw new Error("Message Type not implemeneted.");
}

// So easy to build yet so hard to decode... Maybe there's a way of fixing that.
async function add_signature(peer_key, contents) {
	const signature = await crypto.subtle.sign(
		{	name: 'ECDSA',
			hash: 'SHA-256'
		},
		peer_key,
		contents
	);
	return build_buffer([
		Uint8Array.of(signature.byteLength),
		signature,
		contents
	]);
}

const encoder = new TextEncoder();

export async function encode_introduction(peer_key, i_am) {
	const peer_buf = await crypto.subtle.exportKey('raw', peer_key);
	return await add_signature(peer_key, build_buffer([
		Uint8Array.of(i_am), // I-Am
		Uint8Array.of(type_codes.introduction), // Type
		Uint8Array.of(peer_buf.byteLength), // Key Length
		peer_buf // Key Buffer
	]));
}
export async function encode_push_info(peer_key, i_am, push_pk, auth, endpoint) {
	const push_buf = await crypto.subtle.exportKey('raw', push_pk);
	const endpoint_buf = encoder.encode(endpoint);
	return await add_signature(peer_key, build_buffer([
		Uint8Array.of(i_am), // I-Am
		Uint8Array.of(type_codes.push_info), // Type
		Uint8Array.of(push_buf.byteLength), // Key Length
		push_buf, // Push Key
		auth, // Auth nonce
		endpoint_buf // Encoded endpoint
	]));
}
export async function encode_push_auth(peer_key, i_am, app_pk, jwt) {
	const app_buf = await crypto.subtle.exportKey('raw', app_pk);
	const jwt_buf = encoder.encode(jwt);
	return await add_signature(peer_key, build_buffer([
		Uint8Array.of(i_am), // I-Am
		Uint8Array.of(type_codes.push_auth), // Type
		Uint8Array.of(app_buf.byteLength), // Key Length
		app_buf, // Application Server Public Key Buffer
		jwt_buf // Encoded JSON Web Token
	]));
}
export async function encode_sdp(peer_key, i_am, sdp) {
	const sdp_buf = encoder.encode(sdp);
	return await add_signature(peer_key, build_buffer([
		Uint8Array.of(i_am), // I-Am
		Uint8Array.of(type_codes.sdp), // Type
		sdp_buf // Encoded SDP Description
	]));
}
export async function encode_ice(peer_key, i_am, ice) {
	const ice_buf = encoder.encode(ice);
	return await add_signature(peer_key, build_buffer([
		Uint8Array.of(i_am), // I-Am
		Uint8Array.of(type_codes.ice), // Type
		ice_buf // Encoded ICE Candidate
	]));
}
import { strToArray, arrayToStr, fromUrlBase64, toUrlBase64, make_buffer } from './common.mjs';

// UTF-8 Text encoder that's used in a few functions.
const encoder = new TextEncoder();

// By default this makes a jwt that is valid for 12 hours
export async function make_jwt(
	signing_key, 
	audience,
	duration = (12 /*hr*/ * 60 /*min*/ * 60/*sec*/),
	subscriber = "mailto:evan-brass@protonmail.com"
) {
	// Create a JWT that pushers to our subscription will need
	const jwt_header = toUrlBase64(JSON.stringify({
		typ: "JWT",
		alg: "ES256"
	}));
	const experation_stamp = Math.round((Date.now() / 1000) + duration);
	const jwt_body = toUrlBase64(JSON.stringify({
		aud: audience,
		exp: experation_stamp,
		sub: subscriber
	}));
	const signature = toUrlBase64(arrayToStr(await crypto.subtle.sign({
			name: "ECDSA",
			hash: "SHA-256"
		},
		signing_key,
		strToArray(jwt_header + "." + jwt_body)
	)));
	const jwt = jwt_header + '.' + jwt_body + '.' + signature;
	return jwt;
}

async function make_info(type, client_public, server_public) {
	const client_raw = new Uint8Array(await crypto.subtle.exportKey('raw', client_public));
	const client_len = new Uint8Array(2);
	new DataView(client_len.buffer).setUint16(0, client_raw.byteLength, false);

	const server_raw = new Uint8Array(await crypto.subtle.exportKey('raw', server_public));
	const server_len = new Uint8Array(2);
	new DataView(server_len.buffer).setUint16(0, client_raw.byteLength, false);

	const info = make_buffer([
		new Uint8Array(encoder.encode("Content-Encoding: ")),
		new Uint8Array(encoder.encode(type)),
		1, // Null byte.  Uint8Array is initialized to all 0 so we just skip the byte
		new Uint8Array(encoder.encode('P-256')),
		1, // Null byte.
		client_len,
		client_raw,
		server_len,
		server_raw
	]);

	return info;
}

// Function just throws on error and returns nothing on success.
function check_jwt(jwt, endpoint) {
	const audience = new URL(endpoint).origin;
	const body = JSON.parse(fromUrlBase64(jwt.split('.')[1]));
	const experation = Number.parse(body.exp);
	const min_exp = Date.now() / 1000 + 5;
	const max_exp = Date.now() / 1000 + (24 * 60 * 60);
	if (experation < min_exp || experation > max_exp) {
		throw new Error("JWT must have an experation (exp) in its body at least 5 seconds after and no more than 24 hours after the current time when trying to send the push.");
	}
	if (body.aud !== audience) {
		throw new Error("JWT must have an audience property that matches the origin of the endpoint that the push will be sent to.");
	}
}

function pad_data(data) {
	// Max message that a push service is required to deliver is 4KB but we remove the two bytes required for the padding length
	const max_plaintext = 4094; 
	if (data.byteLength > max_plaintext) {
		throw new Error("Data too big.");
	}
	const padding_len = max_plaintext - data.byteLength;
	const content = new Uint8Array(max_plaintext + 2);
	// Uint8Array is zero filled so no need to clear the padding
	const padding_view = new DataView(content.buffer, 0, 2);
	content.set(data, padding_len + 2); // Fill the content
	padding_view.setInt16(0, padding_len, false); // Set the length of padding
	return content;
}

async function build_push_crypt(sub_public, auth, message_key_pair, salt) {
	// Combine the subscription public key with out message private key using Diffie-Helman then use the Hash Key Derivation Function to derive the shared secret:
	const shared_secret = await crypto.subtle.deriveKey(
		{	name: "ECDH",
			public: sub_public
		},
		message_key_pair.privateKey,
		{ name: "HKDF" },
		false,
		['deriveBits']
	);		
	
	const auth_info = encoder.encode('Content-Encoding: auth\0');

	// Shared Secret + Authentication Secret + ("WebPush: info" || 0x00 || user_agent_public || application_server_public)
	const prk = await crypto.subtle.importKey(
		"raw", 
		await crypto.subtle.deriveBits(
			{	name: "HKDF",
				hash: "SHA-256",
				salt: auth,
				info: auth_info
			},
			shared_secret,
			256
		),
		{ name: "HKDF" },
		false,
		["deriveBits"]
	);

	// Construct the the encryption key
	let info = await make_info('aesgcm', sub_public, message_key_pair.publicKey);
	const encryption_key = await crypto.subtle.importKey(
		"raw", 
		await crypto.subtle.deriveBits(
			{	name: "HKDF",
				hash: "SHA-256",
				salt,
				info
			},
			prk,
			128
		),
		{ name: "AES-GCM" },
		false,
		["encrypt"]
	);
	
	// Construct the nonce
	info = await make_info('nonce', sub_public, message_key_pair.publicKey);
	const nonce = await crypto.subtle.deriveBits(
		{	name: "HKDF",
			hash: "SHA-256",
			salt,
			info
		},
		prk,
		96
	);

	return [encryption_key, nonce];
}

export async function push(
	subscription, // { endpoint, auth, public }
	as_public, // urlbase64 encoded public application server key
	jwt, 
	data, // Array buffer
	time_to_live = 5 // Store the message for 5 seconds if the user isn't available
) {
	// Pad the data:
	const content = pad_data(data);

	// Check that the JWT has a valid experation time and actually references the endpoint as the audience:
	check_jwt(jwt, subscription.endpoint);
	
	// Generate a single use ECDH key for this message:
	const message_dh = await crypto.subtle.generateKey(
		{	name: 'ECDH',
			namedCurve: 'P-256'
		},
		true,
		['deriveKey']
	);
	const message_dh_encoded = toUrlBase64(arrayToStr(await crypto.subtle.exportKey('raw', message_dh.publicKey)));	

	// Build a random salt:
	const salt = crypto.getRandomValues(new Uint8Array(16));
	const salt_encoded = toUrlBase64(arrayToStr(salt));
	
	// Get the encryption key and nonce that we need:
	const [encryption_key, nonce] = build_push_crypt(
		subscription.public, 
		subscription.auth, 
		message_dh, 
		salt
	);

	// Encrypt the message:
	const body = await crypto.subtle.encrypt(
		{	name: "AES-GCM",
			iv: nonce
		},
		encryption_key,
		content
	);
	console.log(body);

	// Create a fetch request to send to the push server
	const headers = new Headers();
	headers.append('Encryption', `salt=${salt_encoded}`);
	headers.append('Crypto-Key', `dh=${message_dh_encoded}`);
	headers.append('Content-Encoding', 'aesgcm');
	const as_public_encoded = toUrlBase64(arrayToStr(await crypto.subtle.exportKey('raw', as_public)));
	headers.append('Authorization', `vapid t=${jwt}, k=${as_public_encoded}`);
	headers.append('ttl', time_to_live.toString());
	
	const options = {
		method: 'POST',
		headers,
		body,
		cache: 'no-store',
		mode: 'cors',
		referrerPolicy: 'no-referrer'
	};
	try {
		return await fetch(subscription.endpoint, options);
	} catch {
		// HACK: Since Google Cloud Messenger doesn't provide CORS I'm using cors-anywhere
		// Try again using CORS anywhere:
		await fetch('https://cors-anywhere.herokuapp.com/' + subscription.endpoint, options);
	}
}
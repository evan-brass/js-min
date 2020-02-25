import Peer from './peer.mjs';
import { parse_message } from './signaling-api.mjs';
import NodeArray from 'users/node-array-2.mjs';
import User from 'users/user.mjs';

class PeerStore {
	constructor() {
		// Listen to incoming push messages:
		const registration = navigator.serviceWorker.getRegistration();
		if (registration.then) {
			registration.then(reg => reg.addEventListener('message', this.handle_push.bind(this)));
		} else {
			registration.addEventListener('message', this.handle_push.bind(this));
		}

		// Start a connection to the peer database
		this.db = wrap_request(indexedDB.open('peersistence', 1), {
			upgradeneeded: ({target, oldVersion}) => {
				const db = target.result;
				if (oldVersion == 0) {
					// This is where we'll store our local keys: CryptoKeyPair's for the application server that we use with our subscription
					db.createObjectStore('peers', { keyPath: 'id', autoIncrement: true });
				}
			}
		}).then(({result}) => result);

		// since the array can change, I figure 
		this.peers = new NodeArray();

		// I Am mapping:
		this.i_am = new Map();

		// Start the process of filling the peers using the database:
		this.load_peers();
	}
	get [User]() {
		return this.peers;
	}
	async load_peers() {
		const db = await this.db;
		let transaction = db.transaction(['peers'], 'readonly');
		let request = transaction.objectStore('peers').getAll();
		const datas = (await wrap_request(request)).result;
		for (const data of datas) {
			this.peers.push(new Peer(data));
		}
	}
	async new_peer(data) {
		
	}
	async handle_push(message) {
		if (message.type == 'push') {
			const message = parse_message(message.data);
			// TODO: Check signatures + route the message to the right peer object
			const possible_signers = this.i_am.get(message.i_am);
			for (const signer of possible_signers) {
				const valid = await crypto.subtle.verify(
					{	name: 'ECDSA',
						hash: 'SHA-256'
					},
					signer.peer_key,
					message.signature,
					message.contents
				);
				if (valid) {
					console.log("Found a message:", message, signer);
					return;
				}
			}
			console.log("Message wasn't signed by any known peers: ", message);
		} else {
			console.log(message);
		}
	}
}

export default new PeerStore();

function wrap_request(request, handlers) {
	return new Promise((resolve, reject) => {
		for (const key in handlers) {
			request.addEventListener(key, handlers[key]);
		}
		request.addEventListener('success', ({target}) => resolve(target));
		request.addEventListener('error', reject);
	});
}

export async function get_peers() {
	const db = await database;
	let transaction = db.transaction(['peers'], 'readonly');
	let request = transaction.objectStore('peers').getAll();
	return (await wrap_request(request)).result;
}
export async function put_peer(peer) {
	const db = await database;
	const transaction = db.transaction(['peers'], 'readwrite');
	return (await wrap_request(transaction.objectStore('peers').put(peer))).result;
}
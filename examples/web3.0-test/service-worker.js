// TODO: Handle peer updates while page isn't focused.
self.addEventListener('push', event => {
	event.waitUntil((async () => {
		for (const client of await clients.matchAll()) {
			const data = event.data.arrayBuffer();
			client.postMessage({
				type: 'push',
				data
			}, [data])
		}
	})());
});
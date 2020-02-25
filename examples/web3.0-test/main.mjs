import peer_store from './peer-store.mjs';

// Build the DOM where peers will be displayed
const peer_table = document.createElement('table');
peer_table.innerHTML = `
<thead>
	<tr>
		<th>Nice Name</th>
		<th>Status</th>
	</tr>
</thead>`;

document.body.appendChild(peer_table);

function reachable(peer) {

}
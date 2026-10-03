import sqlite3InitModule from './sqlite3.mjs';

const DB_URL = 'db/tagforce.db'; // change to your file name
const $ = id => document.getElementById(id);
const esc = v => String(v ?? 'NULL').replace(/[&<>]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]));
let db;

try {
	// sqlite3.wasm is found automatically next to sqlite3.mjs
	const sqlite3 = await sqlite3InitModule();
	const bytes = new Uint8Array(await (await fetch(DB_URL)).arrayBuffer());
	const p = sqlite3.wasm.allocFromTypedArray(bytes);
	db = new sqlite3.oo1.DB();
	db.checkRc(sqlite3.capi.sqlite3_deserialize(
		db.pointer, 'main', p, bytes.length, bytes.length,
		sqlite3.capi.SQLITE_DESERIALIZE_FREEONCLOSE | sqlite3.capi.SQLITE_DESERIALIZE_RESIZEABLE
	));
	$('status').textContent = 'Ready';
	$('run').disabled = false;
} catch (e) {
	$('status').textContent = 'Failed: ' + e.message;
}

$('run').onclick = () => {
	$('error').textContent = '';
	$('out').innerHTML = '';
	try {
		const columns = [], rows = [];
		db.exec({ sql: $('sql').value, rowMode: 'array', columnNames: columns, resultRows: rows });
		if (!columns.length) return;
		const t = document.createElement('table');
		t.innerHTML =
			'<tr>' + columns.map(c => `<th>${esc(c)}</th>`).join('') + '</tr>' +
			rows.map(r => '<tr>' + r.map(v => `<td>${esc(v)}</td>`).join('') + '</tr>').join('');
		$('out').appendChild(t);
	} catch (e) { $('error').textContent = e.message; }
};

navigator.serviceWorker?.register('sw.js');

import { setTimeout as wait } from 'timers/promises';

const BASE = process.env.BACKEND_URL || `http://localhost:${process.env.SERVER_PORT || 8082}`;
const TIMEOUT = 5000; // ms

async function fetchJson(path, opts = {}){
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), TIMEOUT);
  try {
    const res = await fetch(BASE + path, { signal: controller.signal, ...opts });
    clearTimeout(id);
    const text = await res.text();
    let body = null;
    try { body = text ? JSON.parse(text) : null; } catch (e) { body = text; }
    return { status: res.status, body };
  } catch (e) {
    throw e;
  }
}

function fail(msg){
  console.error('❌', msg);
  process.exit(1);
}

(async function main(){
  console.log('Running backend smoke tests against', BASE);
  try {
    console.log('-> Health check');
    const health = await fetchJson('/health');
    if (health.status !== 200) fail('health endpoint failed: ' + JSON.stringify(health));
    console.log('  OK');

    console.log('-> Read tasks');
    const list = await fetchJson('/printTable');
    if (list.status !== 200 || !Array.isArray(list.body)) fail('printTable failed');
    console.log('  OK — tasks:', list.body.length);

    console.log('-> Create task');
    const payload = { taskDetail: 'Smoke test task', lastDate: '2099-12-31' };
    const created = await fetchJson('/insertData', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify(payload) });
    if (created.status !== 201 && created.status !== 200) fail('insertData failed: ' + created.status);
    if (!Array.isArray(created.body)) fail('insertData did not return tasks array');
    const found = created.body.find(t => t.taskDetail === payload.taskDetail);
    if (!found) fail('created task not found in response');
    const id = found.id;
    console.log('  OK — created id', id);

    console.log('-> Update task');
    const updPayload = { taskDetail: 'Smoke test task updated', lastDate: '2099-12-30' };
    const updated = await fetchJson(`/change/task/${id}`, { method: 'PUT', headers: {'Content-Type':'application/json'}, body: JSON.stringify(updPayload)});
    if (updated.status !== 200) fail('update failed');
    const updatedItem = updated.body.find(t => t.id === id && t.taskDetail === updPayload.taskDetail);
    if (!updatedItem) fail('updated item not found');
    console.log('  OK');

    console.log('-> Delete task');
    const deleted = await fetchJson(`/delete/task/${id}`, { method: 'DELETE' });
    if (deleted.status !== 200) fail('delete failed');
    const still = deleted.body.find(t => t.id === id);
    if (still) fail('item still present after delete');
    console.log('  OK');

    console.log('All smoke tests passed ✅');
    process.exit(0);
  } catch (e) {
    console.error('Smoke test error:', e.message || e);
    process.exit(2);
  }
})();

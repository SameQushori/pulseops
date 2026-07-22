import assert from 'node:assert/strict';

const baseUrl = process.env.API_BASE_URL ?? 'http://127.0.0.1:8788';
const incidentPath = '/api/incidents/incident-notification-delay';

async function json(path, init) {
  const response = await fetch(`${baseUrl}${path}`, init);
  assert.ok(
    response.ok,
    `${init?.method ?? 'GET'} ${path}: ${response.status}`,
  );
  return response.json();
}

assert.deepEqual(await json('/api/health'), { status: 'ok' });
assert.equal((await json('/api/overview')).metrics.length, 13);
assert.equal((await json('/api/incidents')).total, 6);
assert.equal((await json('/api/services')).total, 4);

await json(incidentPath, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ status: 'identified', owner: 'Maya Chen' }),
});
const createdNote = await json(`${incidentPath}/notes`, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    author: 'Maya Chen',
    body: 'Full-stack verification note.',
  }),
});
const reloaded = await json(incidentPath);
assert.equal(reloaded.incident.status, 'identified');
assert.equal(reloaded.incident.owner, 'Maya Chen');
assert.ok(reloaded.notes.some(({ id }) => id === createdNote.id));
assert.ok(reloaded.timeline.some(({ type }) => type === 'note_added'));

console.log('Real API persistence flow verified.');

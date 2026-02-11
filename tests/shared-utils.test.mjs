import assert from 'node:assert/strict';
import test from 'node:test';
import { createInitialState, isExpiredGame, toSlug } from '../src/shared/utils.ts';

// --- toSlug ---

test('toSlug lowercases and slugifies', () => {
  assert.equal(toSlug('Hello World'), 'hello-world');
});

test('toSlug replaces multiple non-alnum chars with single dash', () => {
  assert.equal(toSlug('  Foo---Bar  '), 'foo-bar');
});

test('toSlug strips leading/trailing dashes', () => {
  assert.equal(toSlug('---test---'), 'test');
});

test('toSlug handles special characters', () => {
  assert.equal(toSlug("Tom Clancy's Rainbow Six"), 'tom-clancy-s-rainbow-six');
});

test('toSlug returns empty string for empty input', () => {
  assert.equal(toSlug(''), '');
});

// --- isExpiredGame ---

test('isExpiredGame returns true when expiresInMs is 0', () => {
  assert.equal(isExpiredGame({ id: '1', name: 'G', imageUrl: '', expiresInMs: 0 }), true);
});

test('isExpiredGame returns true when expiresInMs is negative', () => {
  assert.equal(isExpiredGame({ id: '1', name: 'G', imageUrl: '', expiresInMs: -1000 }), true);
});

test('isExpiredGame returns false when expiresInMs is positive', () => {
  assert.equal(isExpiredGame({ id: '1', name: 'G', imageUrl: '', expiresInMs: 60000 }), false);
});

test('isExpiredGame returns true when endsAt is in the past', () => {
  const pastDate = new Date(Date.now() - 60_000).toISOString();
  assert.equal(isExpiredGame({ id: '1', name: 'G', imageUrl: '', endsAt: pastDate }), true);
});

test('isExpiredGame returns false when endsAt is in the future', () => {
  const futureDate = new Date(Date.now() + 60_000).toISOString();
  assert.equal(isExpiredGame({ id: '1', name: 'G', imageUrl: '', endsAt: futureDate }), false);
});

test('isExpiredGame returns false when no expiry info', () => {
  assert.equal(isExpiredGame({ id: '1', name: 'G', imageUrl: '' }), false);
});

test('isExpiredGame prefers expiresInMs over endsAt', () => {
  const futureDate = new Date(Date.now() + 60_000).toISOString();
  // expiresInMs=0 means expired, even though endsAt is in the future
  assert.equal(isExpiredGame({ id: '1', name: 'G', imageUrl: '', expiresInMs: 0, endsAt: futureDate }), true);
});

test('isExpiredGame handles null expiresInMs gracefully', () => {
  assert.equal(isExpiredGame({ id: '1', name: 'G', imageUrl: '', expiresInMs: null }), false);
});

// --- createInitialState ---

test('createInitialState returns fresh state object', () => {
  const state = createInitialState();
  assert.equal(state.isRunning, false);
  assert.equal(state.isPaused, false);
  assert.equal(state.selectedGame, null);
  assert.equal(state.activeStreamer, null);
  assert.equal(state.currentDrop, null);
  assert.deepEqual(state.completedDrops, []);
  assert.deepEqual(state.pendingDrops, []);
  assert.deepEqual(state.allDrops, []);
  assert.deepEqual(state.availableGames, []);
  assert.deepEqual(state.queue, []);
  assert.equal(state.completionNotified, false);
});

test('createInitialState returns independent instances', () => {
  const a = createInitialState();
  const b = createInitialState();
  a.queue.push({ id: '1', name: 'G', imageUrl: '' });
  assert.equal(b.queue.length, 0);
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { normalizeToken, scoreDropMatch, tokenOverlapScore } from '../src/shared/matching.ts';

function createDrop(overrides = {}) {
  return {
    id: `drop-${Math.random().toString(36).slice(2)}`,
    name: 'Reward',
    gameId: 'game-1',
    gameName: 'Game',
    imageUrl: '',
    progress: 0,
    claimed: false,
    ...overrides,
  };
}

// --- normalizeToken ---

test('normalizeToken lowercases', () => {
  assert.equal(normalizeToken('Hello World'), 'hello world');
});

test('normalizeToken replaces special chars with spaces', () => {
  assert.equal(normalizeToken("Tom Clancy's: Rainbow Six"), 'tom clancy s rainbow six');
});

test('normalizeToken trims', () => {
  assert.equal(normalizeToken('  test  '), 'test');
});

test('normalizeToken collapses multiple separators', () => {
  assert.equal(normalizeToken('foo---bar___baz'), 'foo bar baz');
});

test('normalizeToken handles empty string', () => {
  assert.equal(normalizeToken(''), '');
});

test('normalizeToken preserves numbers', () => {
  assert.equal(normalizeToken('Counter-Strike 2'), 'counter strike 2');
});

// --- tokenOverlapScore ---

test('tokenOverlapScore returns 1 for identical strings', () => {
  assert.equal(tokenOverlapScore('World of Warcraft', 'World of Warcraft'), 1);
});

test('tokenOverlapScore returns 0 for completely different strings', () => {
  assert.equal(tokenOverlapScore('Minecraft', 'Fortnite'), 0);
});

test('tokenOverlapScore ignores tokens shorter than 3 chars', () => {
  // "of" is < 3 chars, so only "world" and "warcraft" count
  const score = tokenOverlapScore('World of Warcraft', 'World of Tanks');
  // overlap: "world" (1 of max 2 tokens on each side)
  assert.equal(score, 0.5);
});

test('tokenOverlapScore returns 0 when one side has no qualifying tokens', () => {
  assert.equal(tokenOverlapScore('AB', 'CD'), 0);
});

test('tokenOverlapScore handles partial overlap', () => {
  // "call", "duty", "modern", "warfare" vs "call", "duty", "black", "ops"
  // overlap: "call", "duty" = 2, max size = 4
  const score = tokenOverlapScore('Call of Duty: Modern Warfare', 'Call of Duty: Black Ops');
  assert.equal(score, 0.5);
});

// --- scoreDropMatch ---

test('scoreDropMatch returns 1000 for exact ID match', () => {
  const a = createDrop({ id: 'drop-123' });
  const b = createDrop({ id: 'drop-123' });
  assert.equal(scoreDropMatch(a, b), 1000);
});

test('scoreDropMatch scores name match', () => {
  const a = createDrop({ name: 'Gold Chest' });
  const b = createDrop({ name: 'Gold Chest' });
  const score = scoreDropMatch(a, b);
  assert.ok(score >= 40, `Expected score >= 40, got ${score}`);
});

test('scoreDropMatch scores partial name match', () => {
  const a = createDrop({ name: 'Gold Chest' });
  const b = createDrop({ name: 'Gold Chest Deluxe' });
  const score = scoreDropMatch(a, b);
  assert.ok(score >= 15, `Expected score >= 15, got ${score}`);
});

test('scoreDropMatch scores same game name', () => {
  const a = createDrop({ gameName: 'Fortnite' });
  const b = createDrop({ gameName: 'Fortnite' });
  const score = scoreDropMatch(a, b);
  assert.ok(score >= 20, `Expected score >= 20, got ${score}`);
});

test('scoreDropMatch scores same imageUrl', () => {
  const a = createDrop({ imageUrl: 'https://img.twitch.tv/reward.png' });
  const b = createDrop({ imageUrl: 'https://img.twitch.tv/reward.png' });
  const score = scoreDropMatch(a, b);
  assert.ok(score >= 40, `Expected score >= 40, got ${score}`);
});

test('scoreDropMatch scores same campaignId', () => {
  const a = createDrop({ campaignId: 'campaign-abc' });
  const b = createDrop({ campaignId: 'campaign-abc' });
  const score = scoreDropMatch(a, b);
  assert.ok(score >= 30, `Expected score >= 30, got ${score}`);
});

test('scoreDropMatch returns 0 for completely different drops', () => {
  const a = createDrop({ id: 'a', name: 'Alpha', gameName: 'X', imageUrl: 'x', campaignId: 'x' });
  const b = createDrop({ id: 'b', name: 'Beta', gameName: 'Y', imageUrl: 'y', campaignId: 'y' });
  assert.equal(scoreDropMatch(a, b), 0);
});

test('scoreDropMatch accumulates multiple signals', () => {
  const a = createDrop({ name: 'Gold Chest', gameName: 'Fortnite', campaignId: 'c1', imageUrl: 'img1' });
  const b = createDrop({ name: 'Gold Chest', gameName: 'Fortnite', campaignId: 'c1', imageUrl: 'img1' });
  const score = scoreDropMatch(a, b);
  // 40 (name) + 15 (includes) + 20 (game) + 40 (image) + 30 (campaign) = 145
  assert.equal(score, 145);
});

import type { TwitchDrop } from '../types/index.ts';

export function normalizeToken(value: string): string {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, ' ')
    .trim();
}

export function tokenOverlapScore(left: string, right: string): number {
  const leftTokens = new Set(
    normalizeToken(left)
      .split(' ')
      .filter((token) => token.length >= 3),
  );
  const rightTokens = new Set(
    normalizeToken(right)
      .split(' ')
      .filter((token) => token.length >= 3),
  );
  if (leftTokens.size === 0 || rightTokens.size === 0) {
    return 0;
  }
  let overlap = 0;
  leftTokens.forEach((token) => {
    if (rightTokens.has(token)) {
      overlap += 1;
    }
  });
  return overlap / Math.max(leftTokens.size, rightTokens.size);
}

export function scoreDropMatch(base: TwitchDrop, candidate: TwitchDrop): number {
  if (base.id && candidate.id && base.id === candidate.id) {
    return 1000;
  }
  const baseName = normalizeToken(base.name);
  const candidateName = normalizeToken(candidate.name);
  const baseGame = normalizeToken(base.gameName);
  const candidateGame = normalizeToken(candidate.gameName);
  let score = 0;
  if (baseName === candidateName) {
    score += 40;
  }
  if (candidateName.includes(baseName) || baseName.includes(candidateName)) {
    score += 15;
  }
  if (baseGame && candidateGame && (baseGame.includes(candidateGame) || candidateGame.includes(baseGame))) {
    score += 20;
  }
  if (base.imageUrl && candidate.imageUrl && base.imageUrl === candidate.imageUrl) {
    score += 40;
  }
  if (base.campaignId && candidate.campaignId && base.campaignId === candidate.campaignId) {
    score += 30;
  }
  return score;
}

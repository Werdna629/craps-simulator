// Bet definitions, payouts, and exact expected-value math.
//
// EV is reported two ways:
//   - evPerResolution: expected $ result each time the bet is decided (win/lose).
//   - evPerRoll:       expected $ result per dice roll while the bet is working.
// House edge is quoted as a fraction of the amount wagered, per resolution.

import { WAYS, prob, POINTS, probPointBeforeSeven } from './dice.js';

// Profit-to-stake ratios on a win.
export const PLACE_PAYOUTS = {
  4: [9, 5],
  5: [7, 5],
  6: [7, 6],
  8: [7, 6],
  9: [7, 5],
  10: [9, 5],
};

// True odds paid behind a pass/come point (profit : stake).
export const PASS_ODDS_PAYOUTS = {
  4: [2, 1],
  5: [3, 2],
  6: [6, 5],
  8: [6, 5],
  9: [3, 2],
  10: [2, 1],
};

// Lay odds behind a don't-pass/don't-come point: you risk more to win less,
// at true odds (the inverse of the pass-odds ratio).
export const DONT_ODDS_PAYOUTS = {
  4: [1, 2],
  5: [2, 3],
  6: [5, 6],
  8: [5, 6],
  9: [2, 3],
  10: [1, 2],
};

// Field bet: one-roll bet that wins on 2,3,4,9,10,11,12.
// Two common pay tables for the 2 and 12.
export const FIELD_VARIANTS = {
  // 2 pays double, 12 pays triple (common on the Strip) -> 2.78% house edge.
  triple12: { label: '2 pays 2:1, 12 pays 3:1', mult: { 2: 2, 12: 3 } },
  // 2 and 12 both pay double -> 5.56% house edge.
  double: { label: '2 and 12 pay 2:1', mult: { 2: 2, 12: 2 } },
};
const FIELD_WINNERS = [2, 3, 4, 9, 10, 11, 12];

// Expected number of dice rolls per pass/don't-pass (or come) decision.
// One come-out roll, plus the expected length of the point phase when a point
// is established. ~3.376 rolls.
export function expectedRollsPerLineDecision() {
  let rolls = 1;
  for (const p of POINTS) {
    rolls += prob(p) * (36 / (WAYS[p] + WAYS[7]));
  }
  return rolls;
}

function lineStats({ winProb, loseProb, amount }) {
  const evPerResolution = amount * (winProb - loseProb);
  const evPerRoll = evPerResolution / expectedRollsPerLineDecision();
  return {
    winProb,
    loseProb,
    evPerResolution,
    evPerRoll,
    houseEdge: -(winProb - loseProb), // fraction of amount, per resolution
  };
}

export function passStats(amount = 1) {
  let winProb = prob(7) + prob(11);
  for (const p of POINTS) winProb += prob(p) * probPointBeforeSeven(p);
  return lineStats({ winProb, loseProb: 1 - winProb, amount });
}

export function dontPassStats(amount = 1) {
  const push = prob(12);
  let winProb = prob(2) + prob(3);
  for (const p of POINTS) winProb += prob(p) * (1 - probPointBeforeSeven(p));
  const loseProb = 1 - winProb - push;
  // House edge for don't bets is conventionally quoted per dollar wagered,
  // counting pushes in the denominator, so we don't renormalize.
  const evPerResolution = amount * (winProb - loseProb);
  const evPerRoll = evPerResolution / expectedRollsPerLineDecision();
  return { winProb, loseProb, pushProb: push, evPerResolution, evPerRoll, houseEdge: -(winProb - loseProb) };
}

export function placeStats(point, amount = PLACE_PAYOUTS[point][1]) {
  const [num, den] = PLACE_PAYOUTS[point];
  const winProb = probPointBeforeSeven(point);
  const loseProb = 1 - winProb;
  const profit = (amount * num) / den;
  const evPerResolution = winProb * profit - loseProb * amount;
  const evPerRoll = (WAYS[point] / 36) * profit - (WAYS[7] / 36) * amount;
  return { winProb, loseProb, profit, evPerResolution, evPerRoll, houseEdge: -evPerResolution / amount };
}

export function fieldStats(amount = 1, variant = 'triple12') {
  const mult = FIELD_VARIANTS[variant].mult;
  let ev = 0;
  for (let n = 2; n <= 12; n++) {
    if (FIELD_WINNERS.includes(n)) ev += prob(n) * amount * (mult[n] || 1);
    else ev -= prob(n) * amount;
  }
  let winProb = 0;
  for (const n of FIELD_WINNERS) winProb += prob(n);
  // Field is a one-roll bet, so per-roll and per-resolution EV are identical.
  return { winProb, loseProb: 1 - winProb, evPerResolution: ev, evPerRoll: ev, houseEdge: -ev / amount };
}

// Odds bets are paid at true odds, so their EV is exactly zero. Exposed for
// completeness and so the UI can show that taking odds is a fair bet.
export function oddsStats(amount = 1) {
  return { evPerResolution: 0, evPerRoll: 0, houseEdge: 0, amount };
}

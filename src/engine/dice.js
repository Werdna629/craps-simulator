// Dice fundamentals for two six-sided dice.
//
// Everything in the statistical engine is derived from these exact counts,
// so the math is verifiable rather than hard-coded.

// Number of ways to roll each total with two dice (out of 36 equally likely
// outcomes).
export const WAYS = {
  2: 1,
  3: 2,
  4: 3,
  5: 4,
  6: 5,
  7: 6,
  8: 5,
  9: 4,
  10: 3,
  11: 2,
  12: 1,
};

export const TOTAL_OUTCOMES = 36;

// Probability of rolling a given total.
export function prob(total) {
  return (WAYS[total] || 0) / TOTAL_OUTCOMES;
}

// The six point numbers.
export const POINTS = [4, 5, 6, 8, 9, 10];

// P(rolling `point` before a 7) once a point is on. Only 7s and the point
// matter; every other roll is a no-op, so this is ways(point)/(ways(point)+ways(7)).
export function probPointBeforeSeven(point) {
  return WAYS[point] / (WAYS[point] + WAYS[7]);
}

// Roll a single fair die.
export function rollDie(rng = Math.random) {
  return 1 + Math.floor(rng() * 6);
}

// Roll two dice, returning their total.
export function rollDice(rng = Math.random) {
  return rollDie(rng) + rollDie(rng);
}

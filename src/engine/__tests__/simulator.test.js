import { describe, it, expect } from 'vitest';
import { simulateSession, simulateBatch, makeRng } from '../simulator.js';
import { defaultStrategy } from '../strategy.js';
import { passStats, placeStats, fieldStats } from '../bets.js';

// Run one very long session with no chance of busting, and compare the
// empirical edge (net / total wagered) against the analytic house edge.
function empiricalEdge(strategy, rolls, seed = 12345) {
  const r = simulateSession(
    strategy,
    { startingBankroll: 1e12, maxRolls: rolls, stopOnBust: false },
    makeRng(seed),
  );
  return r.net / r.wagered;
}

describe('simulator converges to theoretical edge', () => {
  it('pass line only ~ -1.414% of action', () => {
    const s = { ...defaultStrategy(), passLine: { amount: 10, oddsMultiple: 0 } };
    expect(empiricalEdge(s, 2_000_000)).toBeCloseTo(passStats(1).evPerResolution, 2);
  });

  it('place 6 only ~ -1.515% of action', () => {
    const s = { ...defaultStrategy(), passLine: { amount: 0, oddsMultiple: 0 }, place: { 4: 0, 5: 0, 6: 6, 8: 0, 9: 0, 10: 0 }, placeWorkingComeOut: true };
    expect(empiricalEdge(s, 2_000_000)).toBeCloseTo(-placeStats(6, 6).houseEdge, 2);
  });

  it('field only ~ -2.778% of action', () => {
    const s = { ...defaultStrategy(), passLine: { amount: 0, oddsMultiple: 0 }, field: 5, fieldVariant: 'triple12' };
    expect(empiricalEdge(s, 1_000_000)).toBeCloseTo(-fieldStats(1, 'triple12').houseEdge, 2);
  });

  it('come bets only ~ -1.414% of action', () => {
    const s = { ...defaultStrategy(), passLine: { amount: 0, oddsMultiple: 0 }, come: { amount: 10, oddsMultiple: 0, maxBets: 2 } };
    // Come bets need a point to be on; pass-line bet drives the come-out.
    s.passLine = { amount: 10, oddsMultiple: 0 };
    const edge = empiricalEdge(s, 2_000_000);
    expect(edge).toBeCloseTo(passStats(1).evPerResolution, 2);
  });

  it('taking odds lowers the edge per dollar of action', () => {
    const noOdds = { ...defaultStrategy(), passLine: { amount: 10, oddsMultiple: 0 } };
    const withOdds = { ...defaultStrategy(), passLine: { amount: 10, oddsMultiple: 5 } };
    expect(Math.abs(empiricalEdge(withOdds, 2_000_000))).toBeLessThan(Math.abs(empiricalEdge(noOdds, 2_000_000)));
  });
});

describe('batch summary', () => {
  it('is reproducible with a seed and reports sane fields', () => {
    const s = { ...defaultStrategy(), passLine: { amount: 10, oddsMultiple: 1 } };
    const opts = { startingBankroll: 300, maxRolls: 200, sessions: 500, seed: 7, stopOnBust: true };
    const a = simulateBatch(s, opts);
    const b = simulateBatch(s, opts);
    expect(a.mean).toBe(b.mean);
    expect(a.sessions).toBe(500);
    expect(a.profitablePct).toBeGreaterThanOrEqual(0);
    expect(a.profitablePct).toBeLessThanOrEqual(100);
    expect(a.min).toBeLessThanOrEqual(a.max);
  });
});

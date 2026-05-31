import { describe, it, expect } from 'vitest';
import { simulateSession, simulateBatch, makeRng } from '../simulator.js';
import { defaultStrategy, computeStatistics } from '../strategy.js';
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
    const s = { ...defaultStrategy(), oddsMode: 'none', passLine: { amount: 10, takeOdds: false } };
    expect(empiricalEdge(s, 2_000_000)).toBeCloseTo(passStats(1).evPerResolution, 2);
  });

  it('place 6 only ~ -1.515% of action', () => {
    const s = { ...defaultStrategy(), passLine: { amount: 0, takeOdds: false }, place: { 4: 0, 5: 0, 6: 6, 8: 0, 9: 0, 10: 0 }, placeWorkingComeOut: true };
    expect(empiricalEdge(s, 2_000_000)).toBeCloseTo(-placeStats(6, 6).houseEdge, 2);
  });

  it('field only ~ -2.778% of action', () => {
    const s = { ...defaultStrategy(), passLine: { amount: 0, takeOdds: false }, field: 5, fieldVariant: 'triple12' };
    expect(empiricalEdge(s, 1_000_000)).toBeCloseTo(-fieldStats(1, 'triple12').houseEdge, 2);
  });

  it('come bets only ~ -1.414% of action', () => {
    const s = { ...defaultStrategy(), passLine: { amount: 10, takeOdds: false }, come: { amount: 10, takeOdds: false, maxBets: 2 } };
    expect(empiricalEdge(s, 2_000_000)).toBeCloseTo(passStats(1).evPerResolution, 2);
  });

  it('odds modes match their theoretical blended edge', () => {
    for (const mode of ['none', '2x', '345']) {
      const s = { ...defaultStrategy(), oddsMode: mode, passLine: { amount: 10, takeOdds: true } };
      const theory = -computeStatistics(s).blendedEdge;
      expect(empiricalEdge(s, 2_000_000)).toBeCloseTo(theory, 2);
    }
  });

  it('more odds lowers the blended edge but not the dollar EV', () => {
    const flat = { ...defaultStrategy(), oddsMode: 'none', passLine: { amount: 10, takeOdds: true } };
    const x2 = { ...defaultStrategy(), oddsMode: '2x', passLine: { amount: 10, takeOdds: true } };
    const x345 = { ...defaultStrategy(), oddsMode: '345', passLine: { amount: 10, takeOdds: true } };

    // Dollar EV per roll is set by the flat bet and is unchanged by odds.
    expect(computeStatistics(x2).evPerRoll).toBeCloseTo(computeStatistics(flat).evPerRoll, 10);
    expect(computeStatistics(x345).evPerRoll).toBeCloseTo(computeStatistics(flat).evPerRoll, 10);

    // Blended edge strictly improves with more odds.
    expect(computeStatistics(x345).blendedEdge).toBeLessThan(computeStatistics(x2).blendedEdge);
    expect(computeStatistics(x2).blendedEdge).toBeLessThan(computeStatistics(flat).blendedEdge);
  });
});

describe('batch summary', () => {
  it('is reproducible with a seed and reports sane fields', () => {
    const s = { ...defaultStrategy(), oddsMode: '2x', passLine: { amount: 10, takeOdds: true } };
    const opts = { startingBankroll: 300, maxRolls: 200, sessions: 500, seed: 7, stopOnBust: true };
    const a = simulateBatch(s, opts);
    const b = simulateBatch(s, opts);
    expect(a.mean).toBe(b.mean);
    expect(a.sessions).toBe(500);
    expect(a.profitablePct).toBeGreaterThanOrEqual(0);
    expect(a.profitablePct).toBeLessThanOrEqual(100);
    expect(a.min).toBeLessThanOrEqual(a.max);
  });

  it('more odds widens the outcome distribution (higher std)', () => {
    const base = { startingBankroll: 100000, maxRolls: 300, sessions: 1500, seed: 42, stopOnBust: false };
    const flat = simulateBatch({ ...defaultStrategy(), oddsMode: 'none', passLine: { amount: 10, takeOdds: true } }, base);
    const x345 = simulateBatch({ ...defaultStrategy(), oddsMode: '345', passLine: { amount: 10, takeOdds: true } }, base);
    expect(x345.std).toBeGreaterThan(flat.std);
  });
});

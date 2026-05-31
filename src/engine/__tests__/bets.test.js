import { describe, it, expect } from 'vitest';
import {
  passStats, dontPassStats, placeStats, fieldStats, oddsStats,
  expectedRollsPerLineDecision, oddsMultipleForPoint, expectedOddsStakePerDecision,
} from '../bets.js';
import { computeStatistics, defaultStrategy } from '../strategy.js';

describe('exact bet math matches known craps figures', () => {
  it('pass line house edge is 7/495 (~1.414%)', () => {
    expect(passStats(1).evPerResolution).toBeCloseTo(-7 / 495, 10);
    expect(passStats(1).houseEdge).toBeCloseTo(0.014141, 5);
  });

  it("don't pass house edge is 27/1980 (~1.364%)", () => {
    expect(dontPassStats(1).evPerResolution).toBeCloseTo(-27 / 1980, 10);
    expect(dontPassStats(1).pushProb).toBeCloseTo(1 / 36, 10);
  });

  it('average rolls per line decision is ~3.376', () => {
    expect(expectedRollsPerLineDecision()).toBeCloseTo(3.3758, 3);
  });

  it('pass line per-roll edge is ~0.419%', () => {
    expect(passStats(1).evPerRoll).toBeCloseTo(-0.004189, 5);
  });

  it('place bet house edges', () => {
    expect(placeStats(6, 6).houseEdge).toBeCloseTo(0.015151, 5);
    expect(placeStats(8, 6).houseEdge).toBeCloseTo(0.015151, 5);
    expect(placeStats(5, 5).houseEdge).toBeCloseTo(0.04, 5);
    expect(placeStats(9, 5).houseEdge).toBeCloseTo(0.04, 5);
    expect(placeStats(4, 5).houseEdge).toBeCloseTo(0.066667, 5);
    expect(placeStats(10, 5).houseEdge).toBeCloseTo(0.066667, 5);
  });

  it('place 6 loses 1/36 per roll', () => {
    expect(placeStats(6, 6).evPerRoll).toBeCloseTo(-1 / 36, 10);
  });

  it('field house edges by pay table', () => {
    expect(fieldStats(1, 'triple12').houseEdge).toBeCloseTo(0.027778, 5);
    expect(fieldStats(1, 'double').houseEdge).toBeCloseTo(0.055556, 5);
  });

  it('odds bets are exactly fair', () => {
    expect(oddsStats(100).evPerResolution).toBe(0);
  });
});

describe('odds policies', () => {
  it('3-4-5x uses 3/4/5 by point; flat modes are uniform', () => {
    expect(oddsMultipleForPoint('345', 4)).toBe(3);
    expect(oddsMultipleForPoint('345', 5)).toBe(4);
    expect(oddsMultipleForPoint('345', 6)).toBe(5);
    expect(oddsMultipleForPoint('345', 10)).toBe(3);
    expect(oddsMultipleForPoint('2x', 4)).toBe(2);
    expect(oddsMultipleForPoint('2x', 6)).toBe(2);
    expect(oddsMultipleForPoint('none', 6)).toBe(0);
  });

  it('expected odds stake per flat dollar', () => {
    expect(expectedOddsStakePerDecision('2x')).toBeCloseTo(2 * (24 / 36), 10); // odds only behind a point
    expect(expectedOddsStakePerDecision('345')).toBeCloseTo(100 / 36, 10); // 2.778x
  });

  it('blended edge: pass + 2x ~ 0.61%, pass + 3-4-5x ~ 0.37%', () => {
    const base = { ...defaultStrategy(), passLine: { amount: 10, takeOdds: true } };
    expect(computeStatistics({ ...base, oddsMode: 'none' }).blendedEdge).toBeCloseTo(0.014141, 4);
    expect(computeStatistics({ ...base, oddsMode: '2x' }).blendedEdge).toBeCloseTo(0.00606, 4);
    expect(computeStatistics({ ...base, oddsMode: '345' }).blendedEdge).toBeCloseTo(0.00374, 4);
  });
});

import { describe, it, expect } from 'vitest';
import {
  passStats, dontPassStats, placeStats, fieldStats, oddsStats,
  expectedRollsPerLineDecision,
} from '../bets.js';

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

// A strategy is a flat "table setup": the same configured bets are kept in
// action every roll, following normal craps rules (pass only on the come-out,
// come bets only while a point is on, odds behind the line, etc.).
//
// Odds are governed by a single venue-level policy (`oddsMode`) — e.g. 3-4-5x
// at a live table vs a flat 2x on a machine — and each line/come bet chooses
// whether to back its point with odds.

import {
  passStats, dontPassStats, placeStats, fieldStats,
  expectedRollsPerLineDecision, expectedOddsStakePerDecision,
} from './bets.js';
import { WAYS } from './dice.js';

export const PLACE_NUMBERS = [4, 5, 6, 8, 9, 10];

export function defaultStrategy() {
  return {
    oddsMode: '345',
    passLine: { amount: 10, takeOdds: true },
    dontPass: { amount: 0, takeOdds: false },
    come: { amount: 0, takeOdds: false, maxBets: 0 },
    dontCome: { amount: 0, takeOdds: false, maxBets: 0 },
    place: { 4: 0, 5: 0, 6: 0, 8: 0, 9: 0, 10: 0 },
    placeWorkingComeOut: false,
    field: 0,
    fieldVariant: 'triple12',
  };
}

// Build the per-bet breakdown plus aggregate expected loss and action for the
// whole strategy. Both EV and action are expressed per dice roll so that bets
// with different resolution cadences can be summed onto a common basis.
//
// Note on come/don't-come: a single come bet has the same EV as a pass-line
// bet. The aggregate approximates exposure as (per-bet figure x maxBets),
// assuming the points are fully working; the simulator models the real ramp-up.
export function computeStatistics(strategy) {
  const rollsPerDecision = expectedRollsPerLineDecision();
  const oddsStakePerFlat = expectedOddsStakePerDecision(strategy.oddsMode);
  const rows = [];
  let evPerRoll = 0;
  let actionPerRoll = 0;

  const add = (name, amount, evRoll, actRoll, extra = {}) => {
    rows.push({ name, amount, evPerRoll: evRoll, actionPerRoll: actRoll, ...extra });
    evPerRoll += evRoll;
    actionPerRoll += actRoll;
  };

  // A pass/come-style line bet, optionally backed with odds.
  const addLine = (name, cfg, stats, count = 1) => {
    const flatAction = (cfg.amount / rollsPerDecision) * count;
    add(name, cfg.amount, stats.evPerRoll * count, flatAction, {
      houseEdge: stats.houseEdge, evPerResolution: stats.evPerResolution, approx: count !== 1,
    });
    if (cfg.takeOdds && oddsStakePerFlat > 0) {
      const oddsAction = (cfg.amount * oddsStakePerFlat / rollsPerDecision) * count;
      add(`${name} Odds`, cfg.amount * oddsStakePerFlat, 0, oddsAction, {
        houseEdge: 0, evPerResolution: 0, fair: true, approx: count !== 1,
      });
    }
  };

  if (strategy.passLine.amount > 0) addLine('Pass Line', strategy.passLine, passStats(strategy.passLine.amount));
  if (strategy.dontPass.amount > 0) addLine("Don't Pass", strategy.dontPass, dontPassStats(strategy.dontPass.amount));
  if (strategy.come.amount > 0 && strategy.come.maxBets > 0)
    addLine(`Come (×${strategy.come.maxBets})`, strategy.come, passStats(strategy.come.amount), strategy.come.maxBets);
  if (strategy.dontCome.amount > 0 && strategy.dontCome.maxBets > 0)
    addLine(`Don't Come (×${strategy.dontCome.maxBets})`, strategy.dontCome, dontPassStats(strategy.dontCome.amount), strategy.dontCome.maxBets);

  for (const n of PLACE_NUMBERS) {
    if (strategy.place[n] > 0) {
      const s = placeStats(n, strategy.place[n]);
      // A place bet is at risk each time it resolves (point or 7).
      const actRoll = strategy.place[n] * ((WAYS[n] + WAYS[7]) / 36);
      add(`Place ${n}`, strategy.place[n], s.evPerRoll, actRoll, { houseEdge: s.houseEdge, evPerResolution: s.evPerResolution });
    }
  }
  if (strategy.field > 0) {
    const s = fieldStats(strategy.field, strategy.fieldVariant);
    add('Field', strategy.field, s.evPerRoll, strategy.field, { houseEdge: s.houseEdge, evPerResolution: s.evPerResolution });
  }

  // Blended house edge over all money wagered (per roll EV / per roll action).
  const blendedEdge = actionPerRoll > 0 ? -evPerRoll / actionPerRoll : 0;
  return { rows, evPerRoll, actionPerRoll, blendedEdge };
}

// Whether any bet in the strategy is configured to take odds (so an odds-mode
// comparison is meaningful).
export function usesOdds(strategy) {
  return [strategy.passLine, strategy.dontPass, strategy.come, strategy.dontCome].some(
    (b) => b.amount > 0 && b.takeOdds && (b.maxBets === undefined || b.maxBets > 0),
  );
}

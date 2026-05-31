// A strategy is a flat "table setup": the same configured bets are kept in
// action every roll, following normal craps rules (pass only on the come-out,
// come bets only while a point is on, odds behind the line, etc.).

import { passStats, dontPassStats, placeStats, fieldStats } from './bets.js';

export const PLACE_NUMBERS = [4, 5, 6, 8, 9, 10];

export function defaultStrategy() {
  return {
    passLine: { amount: 10, oddsMultiple: 0 },
    dontPass: { amount: 0, oddsMultiple: 0 },
    come: { amount: 0, oddsMultiple: 0, maxBets: 0 },
    dontCome: { amount: 0, oddsMultiple: 0, maxBets: 0 },
    place: { 4: 0, 5: 0, 6: 0, 8: 0, 9: 0, 10: 0 },
    placeWorkingComeOut: false,
    field: 0,
    fieldVariant: 'triple12',
  };
}

// Build the per-bet breakdown plus an aggregate expected loss for the whole
// strategy. evPerRoll figures are summed into the headline number.
//
// Note on come/don't-come: a single come bet has the same EV as a pass-line
// bet. The aggregate approximates exposure as (per-bet EV x maxBets), assuming
// the come points are fully working; the simulator models the real ramp-up.
export function computeStatistics(strategy) {
  const rows = [];
  let evPerRoll = 0;

  const add = (name, amount, stats, { approx = false } = {}) => {
    rows.push({ name, amount, ...stats, approx });
    evPerRoll += stats.evPerRoll;
  };

  if (strategy.passLine.amount > 0) {
    add('Pass Line', strategy.passLine.amount, passStats(strategy.passLine.amount));
    if (strategy.passLine.oddsMultiple > 0) {
      add('Pass Odds', strategy.passLine.amount * strategy.passLine.oddsMultiple, {
        winProb: null, loseProb: null, evPerResolution: 0, evPerRoll: 0, houseEdge: 0,
      });
    }
  }
  if (strategy.dontPass.amount > 0) {
    add("Don't Pass", strategy.dontPass.amount, dontPassStats(strategy.dontPass.amount));
    if (strategy.dontPass.oddsMultiple > 0) {
      add("Don't Pass Odds", strategy.dontPass.amount * strategy.dontPass.oddsMultiple, {
        winProb: null, loseProb: null, evPerResolution: 0, evPerRoll: 0, houseEdge: 0,
      });
    }
  }
  if (strategy.come.amount > 0 && strategy.come.maxBets > 0) {
    const s = passStats(strategy.come.amount);
    add(`Come (x${strategy.come.maxBets})`, strategy.come.amount,
      { ...s, evPerRoll: s.evPerRoll * strategy.come.maxBets }, { approx: true });
  }
  if (strategy.dontCome.amount > 0 && strategy.dontCome.maxBets > 0) {
    const s = dontPassStats(strategy.dontCome.amount);
    add(`Don't Come (x${strategy.dontCome.maxBets})`, strategy.dontCome.amount,
      { ...s, evPerRoll: s.evPerRoll * strategy.dontCome.maxBets }, { approx: true });
  }
  for (const n of PLACE_NUMBERS) {
    if (strategy.place[n] > 0) add(`Place ${n}`, strategy.place[n], placeStats(n, strategy.place[n]));
  }
  if (strategy.field > 0) {
    add('Field', strategy.field, fieldStats(strategy.field, strategy.fieldVariant));
  }

  return { rows, evPerRoll };
}

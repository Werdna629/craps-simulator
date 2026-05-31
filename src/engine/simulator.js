// Roll-by-roll craps simulator.
//
// Models a flat "table setup" strategy following standard craps rules. A few
// deliberate simplifications, all EV-neutral or clearly noted:
//   - Odds use a single multiple of the base bet on every point (not 3-4-5x).
//   - Come / don't-come odds are always working (including the come-out roll).
//   - At most one new come (and one don't-come) bet travels per roll, up to the
//     configured maxBets number of established points.

import { rollDie } from './dice.js';
import { PLACE_PAYOUTS, PASS_ODDS_PAYOUTS, DONT_ODDS_PAYOUTS, oddsMultipleForPoint } from './bets.js';
import { PLACE_NUMBERS } from './strategy.js';

// Deterministic PRNG (mulberry32) so seeded batches are reproducible.
export function makeRng(seed) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const profit = (stake, [n, d]) => (stake * n) / d;

export function simulateSession(strategy, opts, rng = Math.random) {
  const { startingBankroll, maxRolls, stopOnBust = true } = opts;

  let bankroll = startingBankroll;
  let wagered = 0;
  let peak = bankroll;
  let trough = bankroll;

  // Active bets on the table.
  let point = null; // pass-line point, null on the come-out
  let pass = null; // { amount, odds }
  let dontPass = null; // { amount, odds }
  const comePoints = {}; // number -> { amount, odds }
  const dontComePoints = {}; // number -> { amount, odds }
  const place = {}; // number -> amount

  // Try to put `amount` at risk; returns true and deducts if affordable.
  const stake = (amount) => {
    if (amount <= 0 || bankroll < amount) return false;
    bankroll -= amount;
    wagered += amount;
    return true;
  };

  let rolls = 0;
  let busted = false;

  while (rolls < maxRolls) {
    const comeOut = point === null;

    // --- 1. Place / ensure configured bets ---
    if (comeOut) {
      if (!pass && strategy.passLine.amount > 0 && stake(strategy.passLine.amount)) {
        pass = { amount: strategy.passLine.amount, odds: 0 };
      }
      if (!dontPass && strategy.dontPass.amount > 0 && stake(strategy.dontPass.amount)) {
        dontPass = { amount: strategy.dontPass.amount, odds: 0 };
      }
    }

    // Odds stake multiple for a given point under this strategy's odds policy.
    const oddsMult = (p) => oddsMultipleForPoint(strategy.oddsMode, p);

    // Pass / don't-pass odds once a point is on.
    if (point !== null) {
      if (pass && pass.odds === 0 && strategy.passLine.takeOdds) {
        const o = oddsMult(point) * pass.amount;
        if (o > 0 && stake(o)) pass.odds = o;
      }
      if (dontPass && dontPass.odds === 0 && strategy.dontPass.takeOdds) {
        const o = oddsMult(point) * dontPass.amount;
        if (o > 0 && stake(o)) dontPass.odds = o;
      }
    }

    // Place bets (up when working).
    const placeWorking = point !== null || strategy.placeWorkingComeOut;
    if (placeWorking) {
      for (const n of PLACE_NUMBERS) {
        if (!place[n] && strategy.place[n] > 0 && stake(strategy.place[n])) place[n] = strategy.place[n];
      }
    }

    // Top up odds on existing come / don't-come points.
    for (const c of Object.keys(comePoints)) {
      const cp = comePoints[c];
      if (cp.odds === 0 && strategy.come.takeOdds) {
        const o = oddsMult(Number(c)) * cp.amount;
        if (o > 0 && stake(o)) cp.odds = o;
      }
    }
    for (const c of Object.keys(dontComePoints)) {
      const cp = dontComePoints[c];
      if (cp.odds === 0 && strategy.dontCome.takeOdds) {
        const o = oddsMult(Number(c)) * cp.amount;
        if (o > 0 && stake(o)) cp.odds = o;
      }
    }

    // New traveling come / don't-come bets during the point phase.
    let travelCome = 0;
    let travelDontCome = 0;
    if (point !== null) {
      if (strategy.come.amount > 0 && Object.keys(comePoints).length < strategy.come.maxBets) {
        if (stake(strategy.come.amount)) travelCome = strategy.come.amount;
      }
      if (strategy.dontCome.amount > 0 && Object.keys(dontComePoints).length < strategy.dontCome.maxBets) {
        if (stake(strategy.dontCome.amount)) travelDontCome = strategy.dontCome.amount;
      }
    }

    // Field is a one-roll bet, valid every roll.
    let field = 0;
    if (strategy.field > 0 && stake(strategy.field)) field = strategy.field;

    // --- 2. Roll ---
    const roll = rollDie(rng) + rollDie(rng);
    rolls++;

    // --- 3. Resolve ---
    // Field (one roll).
    if (field) {
      const mult = { 2: strategy.fieldVariant === 'triple12' ? 2 : 2, 12: strategy.fieldVariant === 'triple12' ? 3 : 2 };
      if ([3, 4, 9, 10, 11].includes(roll)) bankroll += field + field; // 1:1 -> stake back + win
      else if (roll === 2 || roll === 12) bankroll += field + field * mult[roll];
      else bankroll += 0; // 5,6,7,8 lose the staked field
    }

    // Established come points (resolve every roll). Resolve these BEFORE the
    // traveling come bets so a point established this roll isn't also paid as a
    // winner this roll.
    for (const cStr of Object.keys(comePoints)) {
      const c = Number(cStr);
      const cp = comePoints[c];
      if (roll === c) {
        bankroll += cp.amount * 2 + (cp.odds ? cp.odds + profit(cp.odds, PASS_ODDS_PAYOUTS[c]) : 0);
        delete comePoints[c];
      } else if (roll === 7) {
        delete comePoints[c];
      }
    }
    for (const cStr of Object.keys(dontComePoints)) {
      const c = Number(cStr);
      const cp = dontComePoints[c];
      if (roll === 7) {
        bankroll += cp.amount * 2 + (cp.odds ? cp.odds + profit(cp.odds, DONT_ODDS_PAYOUTS[c]) : 0);
        delete dontComePoints[c];
      } else if (roll === c) {
        delete dontComePoints[c];
      }
    }

    // Traveling come / don't-come bets (resolve like a come-out bet this roll).
    if (travelCome) {
      if (roll === 7 || roll === 11) bankroll += travelCome * 2;
      else if (roll === 2 || roll === 3 || roll === 12) bankroll += 0;
      else {
        if (comePoints[roll]) comePoints[roll].amount += travelCome;
        else comePoints[roll] = { amount: travelCome, odds: 0 };
      }
    }
    if (travelDontCome) {
      if (roll === 2 || roll === 3) bankroll += travelDontCome * 2;
      else if (roll === 12) bankroll += travelDontCome; // push, returned
      else if (roll === 7 || roll === 11) bankroll += 0;
      else {
        if (dontComePoints[roll]) dontComePoints[roll].amount += travelDontCome;
        else dontComePoints[roll] = { amount: travelDontCome, odds: 0 };
      }
    }

    // Place bets (only resolve while working).
    if (placeWorking) {
      for (const n of PLACE_NUMBERS) {
        if (!place[n]) continue;
        if (roll === n) {
          bankroll += profit(place[n], PLACE_PAYOUTS[n]); // bet stays up, collect winnings
          wagered += place[n]; // the bet rides and is risked again -> counts as action
        } else if (roll === 7) delete place[n];
      }
    }

    // Pass line / don't pass.
    if (comeOut) {
      if (pass) {
        if (roll === 7 || roll === 11) { bankroll += pass.amount * 2; pass = null; }
        else if (roll === 2 || roll === 3 || roll === 12) { pass = null; }
        // else point established below
      }
      if (dontPass) {
        if (roll === 2 || roll === 3) { bankroll += dontPass.amount * 2; dontPass = null; }
        else if (roll === 12) { bankroll += dontPass.amount; dontPass = null; } // push
        else if (roll === 7 || roll === 11) { dontPass = null; }
      }
      if (![2, 3, 7, 11, 12].includes(roll)) point = roll; // establish point
    } else {
      if (roll === point) {
        if (pass) {
          bankroll += pass.amount * 2 + (pass.odds ? pass.odds + profit(pass.odds, PASS_ODDS_PAYOUTS[point]) : 0);
          pass = null;
        }
        if (dontPass) dontPass = null; // don't pass loses when point is made
        point = null;
      } else if (roll === 7) {
        if (pass) pass = null; // pass + odds lose
        if (dontPass) {
          bankroll += dontPass.amount * 2 + (dontPass.odds ? dontPass.odds + profit(dontPass.odds, DONT_ODDS_PAYOUTS[point]) : 0);
          dontPass = null;
        }
        point = null; // seven-out -> back to come-out
      }
    }

    if (bankroll > peak) peak = bankroll;
    if (bankroll < trough) trough = bankroll;

    // Bust check: broke with nothing left on the table.
    const betsOnTable =
      pass || dontPass || Object.keys(comePoints).length || Object.keys(dontComePoints).length ||
      PLACE_NUMBERS.some((n) => place[n]);
    if (stopOnBust && bankroll <= 0 && !betsOnTable) { busted = true; break; }
  }

  return { endBankroll: bankroll, net: bankroll - startingBankroll, rolls, wagered, busted, peak, trough };
}

// Run many sessions and summarize the distribution of results.
export function simulateBatch(strategy, opts) {
  const { sessions, seed } = opts;
  const rng = seed != null ? makeRng(seed) : Math.random;

  const nets = [];
  let totalRolls = 0;
  let totalWagered = 0;
  let bustCount = 0;

  for (let i = 0; i < sessions; i++) {
    const r = simulateSession(strategy, opts, rng);
    nets.push(r.net);
    totalRolls += r.rolls;
    totalWagered += r.wagered;
    if (r.busted) bustCount++;
  }

  nets.sort((a, b) => a - b);
  const n = nets.length;
  const mean = nets.reduce((s, x) => s + x, 0) / n;
  const variance = nets.reduce((s, x) => s + (x - mean) ** 2, 0) / n;
  const median = n % 2 ? nets[(n - 1) / 2] : (nets[n / 2 - 1] + nets[n / 2]) / 2;
  const profitable = nets.filter((x) => x > 0).length;

  return {
    sessions: n,
    nets,
    mean,
    median,
    std: Math.sqrt(variance),
    min: nets[0],
    max: nets[n - 1],
    profitablePct: (profitable / n) * 100,
    bustPct: (bustCount / n) * 100,
    totalRolls,
    totalWagered,
    meanRollsPerSession: totalRolls / n,
    // Empirical edge per dollar of action, for comparison with theory.
    edgePerDollarWagered: totalWagered ? nets.reduce((s, x) => s + x, 0) / totalWagered : 0,
  };
}

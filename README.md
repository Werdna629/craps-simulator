# craps-simulator

A small web app for trying out craps betting strategies in two modes:

- **Statistical** — the exact mathematical expected value of a strategy, derived
  from the dice probabilities (no simulation involved).
- **Simulated** — Monte Carlo batch runs that play the strategy out roll-by-roll
  over many sessions, so you can see the *distribution* of outcomes, not just the
  average.

## Running it

```bash
npm install
npm run dev      # start the dev server
npm run build    # production build into dist/
npm test         # run the engine test suite (Vitest)
```

## How a strategy works

You build a flat "table setup": a fixed set of bets that are kept working every
roll, following normal craps rules. Set any bet to `0` to skip it. Supported bets:

- **Pass Line / Don't Pass** (with odds)
- **Come / Don't Come** (with odds, up to *N* points working)
- **Place** bets on 4, 5, 6, 8, 9, 10
- **Field** (selectable 2/12 pay table)

## The math (Statistical mode)

Everything is derived from the exact two-dice distribution in
`src/engine/dice.js`, so the numbers are verifiable rather than hard-coded. The
test suite checks them against the published house edges:

| Bet            | House edge (per resolution) |
| -------------- | --------------------------- |
| Pass / Come    | 1.41%                       |
| Don't Pass/Come| 1.36%                       |
| Place 6 / 8    | 1.52%                       |
| Place 5 / 9    | 4.00%                       |
| Place 4 / 10   | 6.67%                       |
| Field (3:1 12) | 2.78%                       |
| Field (2:1 12) | 5.56%                       |
| Odds           | 0% (a fair bet)             |

The headline figure is **expected value per roll** (and per hour, given a
rolls/hour assumption), summed across the active bets. Odds bets don't change
your expected dollar loss — they're fair — but they grow your action, which
lowers the blended edge on total money wagered.

## Simulation mode

Runs many independent sessions (configurable starting bankroll, rolls per
session, and session count; optional fixed seed for reproducibility) and reports
the mean/median/spread, the % of sessions that finished profitable or busted, and
a histogram of net results. It also reconciles the empirical edge against the
theoretical EV.

## Odds policy: table vs machine

Odds are set by a single venue-level policy you can switch between and compare:

- **3-4-5× (table)** — 3× behind 4/10, 4× behind 5/9, 5× behind 6/8 (the usual
  live-table rule; it equalizes the win at 6× the flat on every point).
- **flat N× (machine)** — the same multiple on every point; video craps is
  typically a flat **2×**. Options for 1/2/3/5/10× are included.

Each line/come bet chooses whether to back its point with odds. The Statistical
tab includes a side-by-side comparison across all policies.

Worth understanding: an odds bet is mathematically **fair** (0% edge), so adding
more odds **does not change your expected dollar loss** — that's fixed by the
flat bet. What it changes is the **blended edge on total action** (lower with
more odds) and the **variance** of outcomes (higher). For pass-line with a flat
bet, the combined edge on action is ~1.41% (no odds), ~0.61% (2×), ~0.37%
(3-4-5×) — all on the *same* expected dollar loss.

## Modeling notes / simplifications

These are EV-neutral or clearly bounded, and kept simple on purpose:

- Don't-side lay odds use the same per-point stake multiple as the do-side
  (consistent and fair, rather than casino-specific lay caps).
- Come / don't-come odds are always working, including on the come-out roll.
- At most one new come (and one don't-come) bet travels per roll, up to the
  configured maximum number of established points.

## Layout

```
src/engine/   pure, framework-free craps engine
  dice.js       two-dice probabilities
  bets.js       payouts + exact expected value per bet
  strategy.js   strategy shape + statistical aggregation
  simulator.js  roll-by-roll session + batch runner (seeded PRNG)
  __tests__/    math + simulation-vs-theory tests
src/components/ React UI (strategy builder + the two mode views)
```

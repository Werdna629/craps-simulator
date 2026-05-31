import React, { useMemo, useState } from 'react';
import { computeStatistics, usesOdds } from '../engine/strategy.js';
import { ODDS_MODES } from '../engine/bets.js';
import { money, pct, signedMoney } from '../format.js';

export default function StatisticalView({ strategy }) {
  const [rollsPerHour, setRollsPerHour] = useState(100);
  const stats = useMemo(() => computeStatistics(strategy), [strategy]);
  const { rows, evPerRoll, actionPerRoll, blendedEdge } = stats;

  // Compare the same flat bets across every odds policy.
  const comparison = useMemo(
    () => Object.keys(ODDS_MODES).map((mode) => ({ mode, ...computeStatistics({ ...strategy, oddsMode: mode }) })),
    [strategy],
  );

  if (rows.length === 0) {
    return <p className="empty">Add at least one bet to see the math.</p>;
  }

  return (
    <div className="stat-view">
      <div className="headline">
        <div className="big-stat">
          <span className="label">Expected value / roll</span>
          <span className={evPerRoll < 0 ? 'neg' : 'pos'}>{signedMoney(evPerRoll)}</span>
        </div>
        <div className="big-stat">
          <span className="label">Expected value / hour</span>
          <span className={evPerRoll < 0 ? 'neg' : 'pos'}>{signedMoney(evPerRoll * rollsPerHour)}</span>
        </div>
        <div className="big-stat">
          <span className="label">Edge on action</span>
          <span className="neg">{pct(blendedEdge)}</span>
        </div>
        <label className="num">
          <span>rolls / hour</span>
          <input type="number" min={1} value={rollsPerHour} style={{ width: 70 }}
            onChange={(e) => setRollsPerHour(Number(e.target.value) || 1)} />
        </label>
      </div>

      <table>
        <thead>
          <tr>
            <th>Bet</th><th>Amount</th><th>House edge</th>
            <th>EV / resolution</th><th>EV / roll</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              <td>{r.name}{r.approx && <span className="tag" title="Approximated; the simulator models real come-bet ramp-up">≈</span>}</td>
              <td>{money(r.amount)}</td>
              <td>{r.fair ? 'fair (0%)' : pct(r.houseEdge)}</td>
              <td className={r.evPerResolution < 0 ? 'neg' : ''}>{signedMoney(r.evPerResolution ?? 0)}</td>
              <td className={r.evPerRoll < 0 ? 'neg' : ''}>{signedMoney(r.evPerRoll)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {usesOdds(strategy) ? (
        <div className="compare">
          <h3>Odds policy comparison</h3>
          <p className="hint">
            Same flat bets, different maximum odds. Notice the expected dollar loss per roll
            <strong> doesn't change</strong> — odds are a fair (0% edge) bet, so they never alter your
            expectation in dollars. What improves is the <em>edge on total action</em>: you're putting more
            money at fair odds, which dilutes the house edge across everything you wager (at the cost of
            bigger swings — see the Simulated tab).
          </p>
          <table>
            <thead>
              <tr><th>Odds policy</th><th>EV / roll</th><th>Action / roll</th><th>Edge on action</th></tr>
            </thead>
            <tbody>
              {comparison.map((c) => (
                <tr key={c.mode} className={c.mode === strategy.oddsMode ? 'current' : ''}>
                  <td>{ODDS_MODES[c.mode].label}{c.mode === strategy.oddsMode ? ' ←' : ''}</td>
                  <td className="neg">{signedMoney(c.evPerRoll)}</td>
                  <td>{money(c.actionPerRoll)}</td>
                  <td>{pct(c.blendedEdge)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <p className="hint">
          Enable “take odds” on a line or come bet to compare odds policies (e.g. a live table's 3-4-5×
          vs a machine's flat 2×).
        </p>
      )}

      <p className="hint">
        House edge is per dollar wagered, per resolution (the standard quote). <span className="tag">≈</span>
        marks come / don't-come rows, where the per-roll figure assumes the points are fully working; the
        Simulated tab models the real ramp-up.
      </p>
    </div>
  );
}

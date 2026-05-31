import React, { useMemo, useState } from 'react';
import { computeStatistics, usesOdds } from '../engine/strategy.js';
import { ODDS_MODES } from '../engine/bets.js';
import { money, pct, signedMoney } from '../format.js';
import NumberField from './NumberField.jsx';

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
          <NumberField min={1} value={rollsPerHour} onChange={setRollsPerHour} />
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
            <strong>Your expected dollar loss is the same in every row — that's the point.</strong> Odds are
            paid at true odds (0% edge), so they add exactly $0 to your expectation no matter how much you
            take. Switching from 2× to 3-4-5× doesn't win or lose you money on average; it just pushes more
            fair money through the table, which <em>dilutes the house edge on your total action</em> (the last
            column) — at the cost of bigger swings, which you can see on the Simulated tab.
          </p>
          <table>
            <thead>
              <tr>
                <th>Odds policy</th>
                <th>EV / roll<br /><span className="sub">(unchanged)</span></th>
                <th>Action / roll</th>
                <th>Edge on action<br /><span className="sub">(improves)</span></th>
                <th>Lost per $100 wagered<br /><span className="sub">(improves)</span></th>
              </tr>
            </thead>
            <tbody>
              {comparison.map((c) => (
                <tr key={c.mode} className={c.mode === strategy.oddsMode ? 'current' : ''}>
                  <td>{ODDS_MODES[c.mode].label}{c.mode === strategy.oddsMode ? ' ←' : ''}</td>
                  <td className="neg">{signedMoney(c.evPerRoll)}</td>
                  <td>{money(c.actionPerRoll)}</td>
                  <td>{pct(c.blendedEdge)}</td>
                  <td className="neg">{money(c.blendedEdge * 100)}</td>
                </tr>
              ))}
            </tbody>
          </table>

          <details className="worked-example">
            <summary>Why doesn't the dollar EV change?</summary>
            <p>
              Because the odds portion is a <strong>fair bet — its dollar EV is exactly $0 at any size</strong>,
              so weighting it more heavily still adds nothing. Take a $10 pass line with the point on 4 (odds
              pay 2:1, point hits 1/3 of the time):
            </p>
            <table className="mini">
              <thead>
                <tr><th>Odds taken</th><th>Point hits (⅓)</th><th>Seven-out (⅔)</th><th>EV of odds</th></tr>
              </thead>
              <tbody>
                <tr><td>$20 (2×)</td><td className="pos">+$40</td><td className="neg">−$20</td><td>⅓($40) − ⅔($20) = <strong>$0</strong></td></tr>
                <tr><td>$50 (5×)</td><td className="pos">+$100</td><td className="neg">−$50</td><td>⅓($100) − ⅔($50) = <strong>$0</strong></td></tr>
              </tbody>
            </table>
            <p>
              So the whole bet's dollar EV stays at the flat bet's EV no matter how much odds you take. What
              changes is the edge <em>as a percent of money wagered</em>: more fair money in the denominator
              pulls the blended edge toward 0% (the last two columns). That's the real benefit of a table's
              3-4-5× over a machine's 2× — not a better expected outcome, but more action at a fairer rate.
            </p>
          </details>
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

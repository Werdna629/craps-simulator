import React, { useMemo, useState } from 'react';
import { computeStatistics } from '../engine/strategy.js';
import { money, pct, signedMoney } from '../format.js';

export default function StatisticalView({ strategy }) {
  const [rollsPerHour, setRollsPerHour] = useState(100);
  const { rows, evPerRoll } = useMemo(() => computeStatistics(strategy), [strategy]);

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
              <td>{r.houseEdge === 0 ? 'fair (0%)' : pct(r.houseEdge)}</td>
              <td className={r.evPerResolution < 0 ? 'neg' : ''}>{signedMoney(r.evPerResolution)}</td>
              <td className={r.evPerRoll < 0 ? 'neg' : ''}>{signedMoney(r.evPerRoll)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="hint">
        House edge is per dollar wagered, per resolution (the standard quote). Odds bets are mathematically
        fair (0% edge) — they don't change your expected loss in dollars, but they grow your action, which
        lowers the blended edge on total money bet. <span className="tag">≈</span> marks come / don't-come
        rows, where the per-roll figure assumes the points are fully working; the Simulated tab models the
        real ramp-up.
      </p>
    </div>
  );
}

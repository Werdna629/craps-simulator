import React, { useState } from 'react';
import { simulateBatch } from '../engine/simulator.js';
import { computeStatistics } from '../engine/strategy.js';
import { money, pct, signedMoney } from '../format.js';
import Histogram from './Histogram.jsx';

export default function SimulationView({ strategy }) {
  const [opts, setOpts] = useState({
    startingBankroll: 300,
    maxRolls: 200,
    sessions: 2000,
    stopOnBust: true,
    seed: '',
  });
  const [result, setResult] = useState(null);
  const [running, setRunning] = useState(false);

  const set = (patch) => setOpts({ ...opts, ...patch });

  const run = () => {
    setRunning(true);
    // Defer so the button shows its busy state before the blocking compute.
    setTimeout(() => {
      const seed = opts.seed === '' ? null : Number(opts.seed);
      const r = simulateBatch(strategy, { ...opts, seed });
      setResult(r);
      setRunning(false);
    }, 0);
  };

  const theoryPerRoll = computeStatistics(strategy).evPerRoll;

  return (
    <div className="sim-view">
      <div className="sim-controls">
        <label className="num"><span>starting bankroll $</span>
          <input type="number" min={1} value={opts.startingBankroll}
            onChange={(e) => set({ startingBankroll: Number(e.target.value) || 0 })} /></label>
        <label className="num"><span>rolls / session</span>
          <input type="number" min={1} value={opts.maxRolls}
            onChange={(e) => set({ maxRolls: Number(e.target.value) || 1 })} /></label>
        <label className="num"><span>sessions</span>
          <input type="number" min={1} value={opts.sessions}
            onChange={(e) => set({ sessions: Number(e.target.value) || 1 })} /></label>
        <label className="num"><span>seed (blank = random)</span>
          <input type="number" value={opts.seed} placeholder="random"
            onChange={(e) => set({ seed: e.target.value })} /></label>
        <label className="check">
          <input type="checkbox" checked={opts.stopOnBust}
            onChange={(e) => set({ stopOnBust: e.target.checked })} />
          stop session on bust
        </label>
        <button onClick={run} disabled={running}>{running ? 'Running…' : 'Run simulation'}</button>
      </div>

      {result && (
        <div className="sim-results">
          <div className="cards">
            <Card label="Mean result" value={signedMoney(result.mean)} cls={result.mean < 0 ? 'neg' : 'pos'} />
            <Card label="Median result" value={signedMoney(result.median)} cls={result.median < 0 ? 'neg' : 'pos'} />
            <Card label="Std dev" value={money(result.std)} />
            <Card label="Best / Worst" value={`${signedMoney(result.max)} / ${signedMoney(result.min)}`} />
            <Card label="Profitable" value={`${result.profitablePct.toFixed(1)}%`} />
            <Card label="Busted" value={`${result.bustPct.toFixed(1)}%`} cls={result.bustPct > 0 ? 'neg' : ''} />
          </div>

          <Histogram nets={result.nets} />

          <div className="reconcile">
            <p>
              Empirical edge on action: <strong>{pct(result.edgePerDollarWagered)}</strong> over{' '}
              {money(result.totalWagered)} wagered across {result.sessions.toLocaleString()} sessions
              (avg {result.meanRollsPerSession.toFixed(0)} rolls each).
            </p>
            <p className="hint">
              Theory predicts about <strong>{signedMoney(theoryPerRoll)}/roll</strong> ≈{' '}
              {signedMoney(theoryPerRoll * result.meanRollsPerSession)} per session of this length.
              Simulated mean: {signedMoney(result.mean)}.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}

function Card({ label, value, cls = '' }) {
  return (
    <div className="card">
      <span className="label">{label}</span>
      <span className={`value ${cls}`}>{value}</span>
    </div>
  );
}

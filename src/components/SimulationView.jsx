import React, { useState } from 'react';
import { simulateBatch } from '../engine/simulator.js';
import { computeStatistics } from '../engine/strategy.js';
import { money, pct, signedMoney } from '../format.js';
import Histogram from './Histogram.jsx';
import NumberField from './NumberField.jsx';

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
      // Clamp to sane minimums in case a field was left blank/zero.
      const r = simulateBatch(strategy, {
        ...opts,
        seed,
        startingBankroll: Math.max(1, opts.startingBankroll),
        maxRolls: Math.max(1, opts.maxRolls),
        sessions: Math.max(1, opts.sessions),
      });
      setResult(r);
      setRunning(false);
    }, 0);
  };

  const theoryPerRoll = computeStatistics(strategy).evPerRoll;

  return (
    <div className="sim-view">
      <div className="sim-controls">
        <label className="num"><span>starting bankroll $</span>
          <NumberField min={1} value={opts.startingBankroll} onChange={(v) => set({ startingBankroll: v })} /></label>
        <label className="num"><span>rolls / session</span>
          <NumberField min={1} value={opts.maxRolls} onChange={(v) => set({ maxRolls: v })} /></label>
        <label className="num"><span>sessions</span>
          <NumberField min={1} value={opts.sessions} onChange={(v) => set({ sessions: v })} /></label>
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

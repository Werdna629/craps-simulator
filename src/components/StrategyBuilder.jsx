import React from 'react';
import { PLACE_NUMBERS } from '../engine/strategy.js';
import { FIELD_VARIANTS, ODDS_MODES } from '../engine/bets.js';
import NumberField from './NumberField.jsx';

// A "take odds" checkbox for a line/come bet.
function OddsToggle({ checked, disabled, onChange }) {
  return (
    <label className="check" title={disabled ? 'Set odds policy above to enable' : ''}>
      <input type="checkbox" checked={checked} disabled={disabled} onChange={(e) => onChange(e.target.checked)} />
      take odds
    </label>
  );
}

// A labeled number input.
function Num({ label, value, onChange, min = 0, step = 1, width = 70 }) {
  return (
    <label className="num">
      <span>{label}</span>
      <NumberField value={value} onChange={onChange} min={min} step={step} width={width} />
    </label>
  );
}

export default function StrategyBuilder({ strategy, setStrategy }) {
  const set = (patch) => setStrategy({ ...strategy, ...patch });
  const setLine = (key, patch) => set({ [key]: { ...strategy[key], ...patch } });
  const oddsOff = strategy.oddsMode === 'none';

  return (
    <div className="builder">
      <h2>Strategy</h2>
      <p className="hint">
        The same bets are kept working every roll, following craps rules (pass only on the come-out,
        come bets only while a point is on, odds behind the line). Set an amount to 0 to skip a bet.
      </p>

      <section>
        <h3>Odds policy</h3>
        <label className="num">
          <span>maximum odds allowed (the table / machine setting)</span>
          <select value={strategy.oddsMode} onChange={(e) => set({ oddsMode: e.target.value })}>
            {Object.entries(ODDS_MODES).map(([k, v]) => (
              <option key={k} value={k}>{v.label}</option>
            ))}
          </select>
        </label>
      </section>

      <section>
        <h3>Line bets</h3>
        <div className="row">
          <strong>Pass Line</strong>
          <Num label="bet $" value={strategy.passLine.amount} onChange={(v) => setLine('passLine', { amount: v })} />
          <OddsToggle checked={strategy.passLine.takeOdds} disabled={oddsOff} onChange={(v) => setLine('passLine', { takeOdds: v })} />
        </div>
        <div className="row">
          <strong>Don't Pass</strong>
          <Num label="bet $" value={strategy.dontPass.amount} onChange={(v) => setLine('dontPass', { amount: v })} />
          <OddsToggle checked={strategy.dontPass.takeOdds} disabled={oddsOff} onChange={(v) => setLine('dontPass', { takeOdds: v })} />
        </div>
      </section>

      <section>
        <h3>Come bets</h3>
        <div className="row">
          <strong>Come</strong>
          <Num label="bet $" value={strategy.come.amount} onChange={(v) => setLine('come', { amount: v })} />
          <Num label="max #" value={strategy.come.maxBets} onChange={(v) => setLine('come', { maxBets: v })} />
          <OddsToggle checked={strategy.come.takeOdds} disabled={oddsOff} onChange={(v) => setLine('come', { takeOdds: v })} />
        </div>
        <div className="row">
          <strong>Don't Come</strong>
          <Num label="bet $" value={strategy.dontCome.amount} onChange={(v) => setLine('dontCome', { amount: v })} />
          <Num label="max #" value={strategy.dontCome.maxBets} onChange={(v) => setLine('dontCome', { maxBets: v })} />
          <OddsToggle checked={strategy.dontCome.takeOdds} disabled={oddsOff} onChange={(v) => setLine('dontCome', { takeOdds: v })} />
        </div>
      </section>

      <section>
        <h3>Place bets</h3>
        <div className="place-grid">
          {PLACE_NUMBERS.map((n) => (
            <Num
              key={n}
              label={`Place ${n}`}
              value={strategy.place[n]}
              width={60}
              onChange={(v) => set({ place: { ...strategy.place, [n]: v } })}
            />
          ))}
        </div>
        <label className="check">
          <input
            type="checkbox"
            checked={strategy.placeWorkingComeOut}
            onChange={(e) => set({ placeWorkingComeOut: e.target.checked })}
          />
          Place bets working on the come-out
        </label>
      </section>

      <section>
        <h3>Field</h3>
        <div className="row">
          <Num label="bet $" value={strategy.field} onChange={(v) => set({ field: v })} />
          <label className="num">
            <span>pay table</span>
            <select value={strategy.fieldVariant} onChange={(e) => set({ fieldVariant: e.target.value })}>
              {Object.entries(FIELD_VARIANTS).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
          </label>
        </div>
      </section>
    </div>
  );
}

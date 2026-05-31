import React, { useState } from 'react';
import { defaultStrategy } from './engine/strategy.js';
import StrategyBuilder from './components/StrategyBuilder.jsx';
import StatisticalView from './components/StatisticalView.jsx';
import SimulationView from './components/SimulationView.jsx';

export default function App() {
  const [strategy, setStrategy] = useState(defaultStrategy());
  const [mode, setMode] = useState('statistical');

  return (
    <div className="app">
      <header>
        <h1>🎲 Craps Simulator</h1>
        <p>Build a betting strategy, then see its mathematical expectation or run it in batch.</p>
      </header>

      <div className="layout">
        <aside>
          <StrategyBuilder strategy={strategy} setStrategy={setStrategy} />
        </aside>

        <main>
          <nav className="tabs">
            <button className={mode === 'statistical' ? 'active' : ''} onClick={() => setMode('statistical')}>
              Statistical
            </button>
            <button className={mode === 'simulated' ? 'active' : ''} onClick={() => setMode('simulated')}>
              Simulated
            </button>
          </nav>

          {mode === 'statistical'
            ? <StatisticalView strategy={strategy} />
            : <SimulationView strategy={strategy} />}
        </main>
      </div>
    </div>
  );
}

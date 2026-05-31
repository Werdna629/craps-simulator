import React from 'react';
import { money } from '../format.js';

// Bucket the net results and draw simple SVG bars. Profitable buckets are
// green, losing buckets red, the break-even line is marked.
export default function Histogram({ nets, buckets = 30 }) {
  if (!nets.length) return null;
  const min = nets[0];
  const max = nets[nets.length - 1];
  const span = max - min || 1;
  const size = span / buckets;

  const counts = new Array(buckets).fill(0);
  for (const v of nets) {
    let idx = Math.floor((v - min) / size);
    if (idx >= buckets) idx = buckets - 1;
    counts[idx]++;
  }
  const peak = Math.max(...counts);

  const W = 640, H = 220, padL = 40, padB = 28, padT = 10;
  const plotW = W - padL, plotH = H - padB - padT;
  const barW = plotW / buckets;
  const zeroX = padL + ((0 - min) / span) * plotW;

  return (
    <svg className="histogram" viewBox={`0 0 ${W} ${H}`} width="100%">
      {counts.map((c, i) => {
        const h = (c / peak) * plotH;
        const x = padL + i * barW;
        const bucketMid = min + (i + 0.5) * size;
        return (
          <rect key={i} x={x} y={padT + plotH - h} width={Math.max(barW - 1, 1)} height={h}
            className={bucketMid >= 0 ? 'bar-pos' : 'bar-neg'}>
            <title>{`${money(min + i * size)} to ${money(min + (i + 1) * size)}: ${c} sessions`}</title>
          </rect>
        );
      })}
      {min < 0 && max > 0 && (
        <line x1={zeroX} y1={padT} x2={zeroX} y2={padT + plotH} className="zero-line" />
      )}
      <text x={padL} y={H - 8} className="axis">{money(min)}</text>
      <text x={W - 4} y={H - 8} textAnchor="end" className="axis">{money(max)}</text>
      <text x={padL} y={padT + 10} className="axis">{peak} sessions</text>
    </svg>
  );
}

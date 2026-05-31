// Small formatting helpers shared across views.

export const money = (x) =>
  (x < 0 ? '-$' : '$') + Math.abs(x).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

export const pct = (x, digits = 3) => `${(x * 100).toFixed(digits)}%`;

export const signedMoney = (x) => (x >= 0 ? '+' : '') + money(x);

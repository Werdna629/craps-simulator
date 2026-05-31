import React, { useEffect, useState } from 'react';

// A controlled number input that, unlike a raw <input type="number">, lets you
// clear the field while editing instead of snapping back to 0 (which forces you
// to type things like "05"). It keeps its own text state so an empty string is
// allowed mid-edit, reports the parsed number (0 when empty) to the parent, and
// tidies up the display on blur.
export default function NumberField({ value, onChange, min = 0, step = 1, width = 70, placeholder }) {
  const [text, setText] = useState(String(value));

  // Re-sync when the value is changed from outside (e.g. a reset), but not when
  // the change is just our own empty-field-means-0 reporting.
  useEffect(() => {
    if (value !== (text === '' ? 0 : Number(text))) setText(String(value));
  }, [value]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <input
      type="number"
      min={min}
      step={step}
      placeholder={placeholder}
      style={{ width }}
      value={text}
      onChange={(e) => {
        setText(e.target.value);
        onChange(e.target.value === '' ? 0 : Number(e.target.value));
      }}
      onBlur={() => setText(String(value))}
    />
  );
}

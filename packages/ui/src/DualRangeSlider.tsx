// Two-thumb range slider (e.g. min/max star rating) built from two overlapping native <input type="range"> elements sharing one visual track — no drag-and-drop implementation needed, fully keyboard-operable for free.
import { useId } from "react";

export interface DualRangeSliderProps {
  min: number;
  max: number;
  step?: number;
  valueMin: number;
  valueMax: number;
  onChange: (min: number, max: number) => void;
  formatValue?: (v: number) => string;
  label: string;
}

export function DualRangeSlider({
  min,
  max,
  step = 0.1,
  valueMin,
  valueMax,
  onChange,
  formatValue = (v) => v.toFixed(1),
  label,
}: DualRangeSliderProps) {
  const id = useId();
  const pct = (v: number) => ((v - min) / (max - min)) * 100;

  return (
    <div>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          fontSize: 13,
          marginBottom: 8,
          color: "var(--df-text-muted)",
        }}
      >
        <span>{label}</span>
        <span style={{ color: "var(--df-text)", fontWeight: 600 }}>
          {formatValue(valueMin)} – {formatValue(valueMax)}
        </span>
      </div>
      <div style={{ position: "relative", height: 24 }}>
        <div
          style={{
            position: "absolute",
            top: 10,
            left: 0,
            right: 0,
            height: 4,
            borderRadius: 2,
            background: "var(--df-surface-3)",
          }}
        />
        <div
          style={{
            position: "absolute",
            top: 10,
            height: 4,
            borderRadius: 2,
            background: "var(--df-pink)",
            left: `${pct(valueMin)}%`,
            right: `${100 - pct(valueMax)}%`,
          }}
        />
        <input
          id={`${id}-min`}
          type="range"
          min={min}
          max={max}
          step={step}
          value={valueMin}
          aria-label={`${label} minimum`}
          onChange={(e) => onChange(Math.min(Number(e.target.value), valueMax), valueMax)}
          className="df-range-thumb"
          style={{ zIndex: valueMin > max - (max - min) / 2 ? 2 : 1 }}
        />
        <input
          id={`${id}-max`}
          type="range"
          min={min}
          max={max}
          step={step}
          value={valueMax}
          aria-label={`${label} maximum`}
          onChange={(e) => onChange(valueMin, Math.max(Number(e.target.value), valueMin))}
          className="df-range-thumb"
        />
      </div>
    </div>
  );
}

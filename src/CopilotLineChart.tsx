import type { CSSProperties } from "react";
import { CHART_COLOR_SEQUENCE } from "./copilotChartPalette";

export type CopilotLineSeries = {
  label: string;
  values: number[];
};

type CopilotLineChartProps = {
  className?: string;
  series: CopilotLineSeries[];
  title?: string;
  xLabels: string[];
  yLabel?: string;
};

const W = 420;
const H = 200;
const PAD = { b: 38, l: 44, r: 12, t: 16 };

function pathForPoints(
  pts: readonly (readonly [number, number])[],
): string {
  if (pts.length === 0) {
    return "";
  }
  if (pts.length === 1) {
    return "";
  }
  return pts
    .map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x} ${y}`)
    .join(" ");
}

/**
 * Line graph for `showLineChart`: one or more series (same x axis, shared
 * y scale). `xLabels` are in time order; each `series` has a name and
 * `values` aligned to `xLabels`.
 */
export function CopilotLineChart({
  className = "copilotLine",
  series,
  title,
  xLabels,
  yLabel,
}: CopilotLineChartProps) {
  const n = xLabels.length;
  if (n < 1 || !series.length) {
    return null;
  }

  for (const s of series) {
    if (s.values.length !== n) {
      return null;
    }
  }

  const allVals = series.flatMap((s) => s.values);
  const minV = Math.min(...allVals);
  const maxV = Math.max(...allVals);
  const range = maxV - minV || 1e-6;
  const innerW = W - PAD.l - PAD.r;
  const innerH = H - PAD.t - PAD.b;

  const xAt = (i: number) =>
    n === 1
      ? PAD.l + innerW / 2
      : PAD.l + (i / (n - 1)) * innerW;
  const yAt = (v: number) =>
    PAD.t + (1 - (v - minV) / range) * innerH;

  const yGrid = [0, 0.5, 1].map((t) => minV + t * (maxV - minV));

  const fmtY = (tick: number) => {
    if (Math.abs(tick) < 0.000_001) {
      return "0";
    }
    if (Math.abs(tick) >= 1000) {
      return tick.toFixed(0);
    }
    if (Math.abs(tick) < 0.1) {
      return tick.toFixed(2);
    }
    return tick % 1 < 0.01 ? String(Math.round(tick)) : tick.toFixed(1);
  };

  return (
    <div className={className}>
      {title ? <h3 className="copilotLineTitle">{title}</h3> : null}
      {yLabel ? <p className="copilotLineYHint">{yLabel}</p> : null}
      <svg
        className="copilotLineSvg"
        height={H}
        viewBox={`0 0 ${W} ${H}`}
        width="100%"
      >
        <rect
          className="copilotLineFrame"
          height={H - 2}
          rx="4"
          width={W - 2}
          x="1"
          y="1"
        />
        {yGrid.map((tick, gi) => {
          const yy = yAt(tick);
          return (
            <line
              className="copilotLineGrid"
              key={`g-${gi}`}
              x1={PAD.l}
              x2={W - PAD.r}
              y1={yy}
              y2={yy}
            />
          );
        })}
        {yGrid.map((tick, gi) => {
          const yy = yAt(tick);
          return (
            <text
              className="copilotLineYTick"
              key={`t-${gi}`}
              textAnchor="end"
              x={PAD.l - 6}
              y={yy + 4}
            >
              {fmtY(tick)}
            </text>
          );
        })}
        {series.map((s, si) => {
          const color =
            CHART_COLOR_SEQUENCE[si % CHART_COLOR_SEQUENCE.length] ??
            "#5b67f1";
          const pts = s.values.map(
            (v, i) => [xAt(i), yAt(v)] as const,
          );
          const d = pathForPoints(pts);
          return (
            <g key={`${s.label}-${si}`}>
              {d ? (
                <path
                  className="copilotLinePath"
                  d={d}
                  fill="none"
                  stroke={color}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.25"
                />
              ) : null}
              {pts.map(([x, y], pi) => (
                <circle
                  className="copilotLineDot"
                  cx={x}
                  cy={y}
                  key={`d-${si}-${pi}`}
                  r="4.5"
                  style={{
                    fill: color,
                    stroke: "#ffffff",
                    strokeWidth: 2,
                  }}
                />
              ))}
            </g>
          );
        })}
        {xLabels.map((text, i) => {
          const x = xAt(i);
          const y0 = H - 8;
          const short = text.length > 10 ? `${text.slice(0, 8)}…` : text;
          return (
            <text
              className="copilotLineXTick"
              key={`x-${i}`}
              textAnchor="middle"
              transform={n > 6 ? `rotate(-30 ${x} ${y0})` : undefined}
              x={x}
              y={y0}
            >
              {short}
            </text>
          );
        })}
      </svg>
      <ul className="copilotLineLegend">
        {series.map((s, si) => {
          const color =
            CHART_COLOR_SEQUENCE[si % CHART_COLOR_SEQUENCE.length] ??
            "#5b67f1";
          return (
            <li className="copilotLineLegendItem" key={`leg-${si}`}>
              <span
                className="copilotLineLegendSwatch"
                style={{ "--line-c": color } as CSSProperties}
              />
              <span className="copilotLineLegendLabel">{s.label}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}

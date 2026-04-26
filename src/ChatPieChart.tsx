import type { CSSProperties } from "react";
import { CHART_COLOR_SEQUENCE } from "./copilotChartPalette";

type ChatPieChartProps = {
  className?: string;
  labels: string[];
  size?: number;
  title?: string;
  values: number[];
};

type Slice = {
  color: string;
  end: number;
  label: string;
  percent: number;
  start: number;
};

function formatLegendPct(percent: number) {
  return percent < 10 ? percent.toFixed(1) : String(Math.round(percent));
}

function polar(
  cx: number,
  cy: number,
  r: number,
  angle: number,
): [number, number] {
  return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)];
}

function buildSlices(labels: string[], values: number[]): Slice[] {
  const pairs = labels.map((label, i) => ({
    color: CHART_COLOR_SEQUENCE[i % CHART_COLOR_SEQUENCE.length],
    label: label || `Item ${i + 1}`,
    value: values[i] ?? 0,
  })).filter((p) => p.value > 0);

  if (!pairs.length) {
    return [];
  }

  const total = pairs.reduce((sum, p) => sum + p.value, 0);
  if (total <= 0) {
    return [];
  }

  let acc = 0;
  return pairs.map((p) => {
    const start = (acc / total) * Math.PI * 2 - Math.PI / 2;
    acc += p.value;
    const end = (acc / total) * Math.PI * 2 - Math.PI / 2;
    const percent = (p.value / total) * 100;
    return { color: p.color, end, label: p.label, percent, start };
  });
}

function wedgePath(
  cx: number,
  cy: number,
  r: number,
  start: number,
  end: number,
): string {
  if (end - start >= Math.PI * 2 - 1e-6) {
    return [
      "M",
      cx - r,
      cy,
      "A",
      r,
      r,
      "0 1 1",
      cx + r,
      cy,
      "A",
      r,
      r,
      "0 1 1",
      cx - r,
      cy,
    ].join(" ");
  }
  const [x1, y1] = polar(cx, cy, r, start);
  const [x2, y2] = polar(cx, cy, r, end);
  const large = end - start > Math.PI ? 1 : 0;
  return [
    "M",
    cx,
    cy,
    "L",
    x1,
    y1,
    "A",
    r,
    r,
    "0",
    large,
    "1",
    x2,
    y2,
    "Z",
  ].join(" ");
}

/** Pie chart for the dashboard (e.g. copilot `showPieChart` tool). */
export function ChatPieChart({
  className = "pieChart",
  labels,
  size: diameter = 200,
  title,
  values,
}: ChatPieChartProps) {
  const slices = buildSlices(labels, values);
  const size = diameter;
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.43;

  if (!slices.length) {
    return (
      <div className={className}>
        {title ? <h3 className="pieChartTitle">{title}</h3> : null}
        <p className="pieChartEmpty">No data to display.</p>
      </div>
    );
  }

  return (
    <div
      className={className}
      role="img"
      aria-label={title ?? "Pie chart"}
    >
      {title ? <h3 className="pieChartTitle">{title}</h3> : null}
      <div className="pieChartBody">
        <svg
          className="pieChartSvg"
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          width={size}
        >
          {slices.map((slice, i) => (
            <path
              className="pieSlice"
              d={wedgePath(cx, cy, r, slice.start, slice.end)}
              fill={slice.color}
              key={`${slice.label}-${i}`}
            />
          ))}
        </svg>
        <ul className="pieLegend">
          {slices.map((slice, i) => (
            <li className="pieLegendItem" key={`${slice.label}-leg-${i}`}>
              <span
                className="pieSwatch"
                style={{ "--swatch": slice.color } as CSSProperties}
              />
              <span className="pieLegendLabel">
                {`${slice.label} (${formatLegendPct(slice.percent)}%)`}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

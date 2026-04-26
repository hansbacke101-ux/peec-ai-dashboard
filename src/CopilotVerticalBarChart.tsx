import { CHART_COLOR_SEQUENCE } from "./copilotChartPalette";

type CopilotVerticalBarChartProps = {
  className?: string;
  labels: string[];
  title?: string;
  values: number[];
};

const BAR_W = 30;
const GAP = 10;
const CHART_H = 160;
const TOP_LABEL = 18;

/**
 * Stacked column chart for the copilot `showVerticalBarChart` tool.
 */
export function CopilotVerticalBarChart({
  className = "copilotVBar",
  labels,
  title,
  values,
}: CopilotVerticalBarChartProps) {
  const n = labels.length;
  if (!n || labels.length !== values.length) {
    return null;
  }

  const maxVal = Math.max(0.000_001, ...values);
  const innerW = n * (BAR_W + GAP) - GAP;
  const padL = 4;
  const totalW = innerW + padL * 2;
  const axisH = n > 5 ? 58 : 44;
  const totalH = TOP_LABEL + CHART_H + axisH;

  return (
    <div className={className}>
      {title ? <h3 className="copilotVBarTitle">{title}</h3> : null}
      <svg
        className="copilotVBarSvg"
        height={totalH}
        viewBox={`0 0 ${totalW} ${totalH}`}
        width="100%"
      >
        {values.map((value, i) => {
          const h = (value / maxVal) * CHART_H;
          const x0 = padL + i * (BAR_W + GAP);
          const yTop = TOP_LABEL + CHART_H - h;
          const color =
            CHART_COLOR_SEQUENCE[i % CHART_COLOR_SEQUENCE.length];
          const vText =
            value < 0.1 && value > 0
              ? value.toFixed(2)
              : value % 1 === 0
                ? String(value)
                : value.toFixed(1);
          const lx = x0 + BAR_W / 2;
          const yBottom = TOP_LABEL + CHART_H + 6;
          const vY = Math.max(14, yTop - 4);
          return (
            <g key={labels[i] ?? `b-${i}`}>
              <rect
                className="copilotVBarColumn"
                fill={color}
                height={h}
                rx="7"
                ry="7"
                width={BAR_W}
                x={x0}
                y={yTop}
              />
              <text
                className="copilotVBarValue"
                textAnchor="middle"
                x={lx}
                y={vY}
              >
                {vText}
              </text>
              <text
                className="copilotVBarAxisLabel"
                textAnchor="middle"
                transform={
                  n > 5 ? `rotate(-40 ${lx} ${yBottom})` : undefined
                }
                x={lx}
                y={n <= 5 ? yBottom + 14 : yBottom + 6}
              >
                {labels[i].length > 12
                  ? `${labels[i].slice(0, 10)}…`
                  : labels[i]}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

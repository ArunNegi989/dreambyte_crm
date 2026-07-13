"use client";

interface BarSeriesValue {
  key: string;
  value: number;
  color: string;
}

interface BarGroup {
  label: string;
  values: BarSeriesValue[];
}

interface BarChartSVGProps {
  data: BarGroup[];
  height?: number;
  legend?: { key: string; label: string; color: string }[];
}

// Zero-dependency, fully responsive SVG grouped bar chart. Uses a fixed
// logical viewBox and scales to 100% of its container — never overflows,
// never needs horizontal scroll, no matter how many groups there are.
export default function BarChartSVG({ data, height = 190, legend }: BarChartSVGProps) {
  const viewBoxWidth = 600;
  const maxVal = Math.max(1, ...data.flatMap((d) => d.values.map((v) => v.value)));
  const groupGap = data.length > 0 ? Math.min(20, viewBoxWidth / (data.length * 6)) : 20;
  const seriesCount = data[0]?.values.length ?? 1;
  const groupWidth =
    data.length > 0 ? (viewBoxWidth - groupGap * (data.length + 1)) / data.length : viewBoxWidth;
  const barGap = 3;
  const barWidth = Math.max(3, (groupWidth - barGap * (seriesCount - 1)) / seriesCount);
  const chartHeight = height - 26;

  return (
    <div>
      {legend && legend.length > 0 && (
        <div style={{ display: "flex", gap: 16, marginBottom: 10, flexWrap: "wrap" }}>
          {legend.map((l) => (
            <div key={l.key} style={{ display: "flex", alignItems: "center", gap: 6, fontSize: 12 }}>
              <span style={{ width: 10, height: 10, borderRadius: 3, background: l.color, display: "inline-block" }} />
              <span style={{ color: "#64748b", fontWeight: 600 }}>{l.label}</span>
            </div>
          ))}
        </div>
      )}
      <svg
        width="100%"
        height={height}
        viewBox={`0 0 ${viewBoxWidth} ${height}`}
        preserveAspectRatio="xMidYMid meet"
        style={{ display: "block", overflow: "visible" }}
      >
        <line x1={0} y1={chartHeight} x2={viewBoxWidth} y2={chartHeight} stroke="#e2e8f0" strokeWidth={1} />
        {data.map((d, gi) => {
          const groupX = groupGap + gi * (groupWidth + groupGap);
          return (
            <g key={d.label + gi}>
              {d.values.map((v, vi) => {
                const barH = (v.value / maxVal) * (chartHeight - 14);
                const x = groupX + vi * (barWidth + barGap);
                const y = chartHeight - barH;
                return (
                  <g key={v.key}>
                    <rect
                      x={x}
                      y={y}
                      width={barWidth}
                      height={Math.max(barH, v.value > 0 ? 2 : 0)}
                      fill={v.color}
                      rx={Math.min(3, barWidth / 3)}
                      className="sa-bar-rect"
                      style={{ animationDelay: `${(gi * seriesCount + vi) * 0.03}s` }}
                    />
                    {v.value > 0 && barWidth > 6 && (
                      <text
                        x={x + barWidth / 2}
                        y={y - 4}
                        fontSize={9}
                        textAnchor="middle"
                        fill="#64748b"
                      >
                        {v.value}
                      </text>
                    )}
                  </g>
                );
              })}
              <text
                x={groupX + groupWidth / 2}
                y={chartHeight + 16}
                fontSize={9.5}
                textAnchor="middle"
                fill="#64748b"
              >
                {d.label}
              </text>
            </g>
          );
        })}
      </svg>
      <style jsx>{`
        :global(.sa-bar-rect) {
          transform-box: fill-box;
          transform-origin: bottom center;
          animation: saGrowBar 0.55s cubic-bezier(0.34, 1.56, 0.64, 1) both;
        }
        @keyframes saGrowBar {
          from {
            transform: scaleY(0);
            opacity: 0;
          }
          to {
            transform: scaleY(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
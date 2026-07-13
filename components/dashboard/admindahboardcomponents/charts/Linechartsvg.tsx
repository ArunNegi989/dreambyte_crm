"use client";

interface LinePoint {
  label: string;
  value: number; // 0-100
}

interface LineChartSVGProps {
  data: LinePoint[];
  height?: number;
  color?: string;
  suffix?: string;
}

// Zero-dependency, fully responsive SVG line chart — fixed logical viewBox
// scaled to 100% width, so it never needs horizontal scrolling. The line
// draws itself in on mount (CSS-only, via pathLength trick).
export default function LineChartSVG({ data, height = 170, color = "#6366f1", suffix = "%" }: LineChartSVGProps) {
  const viewBoxWidth = 600;
  const padding = 28;
  const maxVal = 100;

  const points = data.map((d, i) => {
    const x =
      data.length > 1
        ? padding + (i * (viewBoxWidth - padding * 2)) / (data.length - 1)
        : viewBoxWidth / 2;
    const y = height - padding - (Math.min(d.value, maxVal) / maxVal) * (height - padding * 2);
    return { x, y, ...d };
  });

  const pathD = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  const areaD =
    points.length > 0
      ? `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`
      : "";

  return (
    <div>
    <svg
      width="100%"
      height={height}
      viewBox={`0 0 ${viewBoxWidth} ${height}`}
      preserveAspectRatio="xMidYMid meet"
      style={{ display: "block", overflow: "visible" }}
    >
      {[0, 25, 50, 75, 100].map((g) => {
        const y = height - padding - (g / maxVal) * (height - padding * 2);
        return (
          <g key={g}>
            <line x1={padding} y1={y} x2={viewBoxWidth - padding} y2={y} stroke="#f1f5f9" strokeWidth={1} />
            <text x={2} y={y + 3} fontSize={8} fill="#cbd5e1">
              {g}
            </text>
          </g>
        );
      })}
      {points.length > 0 && <path d={areaD} fill={color} opacity={0.08} className="sa-line-area" />}
      {points.length > 0 && (
        <path
          d={pathD}
          fill="none"
          stroke={color}
          strokeWidth={2.4}
          strokeLinecap="round"
          strokeLinejoin="round"
          pathLength={1}
          className="sa-line-path"
        />
      )}
      {points.map((p, i) => (
        <g key={i} className="sa-line-point" style={{ animationDelay: `${0.5 + i * 0.05}s` }}>
          <circle cx={p.x} cy={p.y} r={3.6} fill="#fff" stroke={color} strokeWidth={2.2} />
          <text x={p.x} y={height - 8} fontSize={9.5} textAnchor="middle" fill="#64748b">
            {p.label}
          </text>
          <text x={p.x} y={p.y - 10} fontSize={9.5} textAnchor="middle" fill="#334155" fontWeight={700}>
            {p.value}
            {suffix}
          </text>
        </g>
      ))}
    </svg>
      <style jsx>{`
        :global(.sa-line-path) {
          stroke-dasharray: 1;
          stroke-dashoffset: 1;
          animation: saDrawLine 1.2s ease-out forwards;
        }
        @keyframes saDrawLine {
          to {
            stroke-dashoffset: 0;
          }
        }
        :global(.sa-line-area) {
          opacity: 0;
          animation: saAreaFade 0.9s ease 0.5s forwards;
        }
        @keyframes saAreaFade {
          to {
            opacity: 0.08;
          }
        }
        :global(.sa-line-point) {
          opacity: 0;
          animation: saPointIn 0.35s ease forwards;
        }
        @keyframes saPointIn {
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
"use client";

interface PieSlice {
  label: string;
  value: number;
  color: string;
}

interface PieChartSVGProps {
  data: PieSlice[];
  size?: number;
  centerLabel?: string;
  centerValue?: string | number;
}

// Zero-dependency SVG pie/donut chart. No recharts / chart.js needed —
// works in any Next.js app out of the box.
export default function PieChartSVG({
  data,
  size = 170,
  centerLabel,
  centerValue,
}: PieChartSVGProps) {
  const total = data.reduce((s, d) => s + d.value, 0);
  const radius = size / 2;
  const innerRadius = radius * 0.6;
  const cx = radius;
  const cy = radius;

  let cumulativeAngle = -90;

  const arc = (startAngle: number, endAngle: number) => {
    const startRad = (startAngle * Math.PI) / 180;
    const endRad = (endAngle * Math.PI) / 180;
    const x1 = cx + radius * Math.cos(startRad);
    const y1 = cy + radius * Math.sin(startRad);
    const x2 = cx + radius * Math.cos(endRad);
    const y2 = cy + radius * Math.sin(endRad);
    const ix1 = cx + innerRadius * Math.cos(endRad);
    const iy1 = cy + innerRadius * Math.sin(endRad);
    const ix2 = cx + innerRadius * Math.cos(startRad);
    const iy2 = cy + innerRadius * Math.sin(startRad);
    const largeArc = endAngle - startAngle > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${radius} ${radius} 0 ${largeArc} 1 ${x2} ${y2} L ${ix1} ${iy1} A ${innerRadius} ${innerRadius} 0 ${largeArc} 0 ${ix2} ${iy2} Z`;
  };

  const slices =
    total === 0
      ? []
      : data
          .filter((d) => d.value > 0)
          .map((d) => {
            const angle = (d.value / total) * 360;
            const startAngle = cumulativeAngle;
            const endAngle = cumulativeAngle + angle;
            cumulativeAngle = endAngle;
            return { ...d, pathData: arc(startAngle, endAngle), pct: Math.round((d.value / total) * 100) };
          });

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 22, flexWrap: "wrap" }}>
      <div style={{ position: "relative", width: size, height: size, flexShrink: 0 }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {total === 0 ? (
            <circle cx={cx} cy={cy} r={radius - 2} fill="#f1f5f9" />
          ) : (
            slices.map((s, i) => (
              <path
                key={i}
                d={s.pathData}
                fill={s.color}
                stroke="#fff"
                strokeWidth={1.5}
                className="sa-pie-slice"
                style={{ animationDelay: `${i * 0.07}s`, transformOrigin: `${cx}px ${cy}px` }}
              />
            ))
          )}
        </svg>
        {(centerLabel || centerValue !== undefined) && (
          <div
            style={{
              position: "absolute",
              inset: 0,
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              pointerEvents: "none",
            }}
          >
            <span style={{ fontSize: 20, fontWeight: 900, color: "#0f172a", lineHeight: 1 }}>
              {centerValue}
            </span>
            {centerLabel && (
              <span style={{ fontSize: 10, color: "#94a3b8", fontWeight: 600, marginTop: 3 }}>
                {centerLabel}
              </span>
            )}
          </div>
        )}
      </div>
      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {data.map((d) => (
          <div key={d.label} style={{ display: "flex", alignItems: "center", gap: 8, fontSize: 12.5 }}>
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: 3,
                background: d.color,
                display: "inline-block",
                flexShrink: 0,
              }}
            />
            <span style={{ color: "#334155", fontWeight: 600, textTransform: "capitalize" }}>{d.label}</span>
            <span style={{ color: "#94a3b8" }}>
              ({d.value}{total > 0 ? ` · ${Math.round((d.value / total) * 100)}%` : ""})
            </span>
          </div>
        ))}
        {data.length === 0 && <span style={{ fontSize: 12, color: "#94a3b8" }}>No data yet.</span>}
      </div>
      <style jsx>{`
        :global(.sa-pie-slice) {
          animation: saPieIn 0.5s cubic-bezier(0.34, 1.56, 0.64, 1) both;
          transition: filter 0.15s ease;
        }
        :global(.sa-pie-slice:hover) {
          filter: brightness(1.08);
        }
        @keyframes saPieIn {
          from {
            transform: scale(0);
            opacity: 0;
          }
          to {
            transform: scale(1);
            opacity: 1;
          }
        }
      `}</style>
    </div>
  );
}
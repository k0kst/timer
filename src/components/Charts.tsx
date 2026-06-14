// Lightweight hand-rolled SVG charts — no chart library, to stay light and
// match the calm aesthetic (PRD §4.4.3, §6.3).

interface BarChartProps {
  labels: string[]
  values: number[]
  unit?: string
  color?: string
}

/** Single-series vertical bar chart. */
export function BarChart({ labels, values, unit = '', color = 'var(--teal)' }: BarChartProps) {
  const max = Math.max(1, ...values)
  const h = 120
  return (
    <div className="chart">
      <div className="bars" style={{ height: h }}>
        {values.map((v, i) => (
          <div className="bar-col" key={i}>
            <div className="bar-value">{v > 0 ? `${Math.round(v * 10) / 10}${unit}` : ''}</div>
            <div
              className="bar"
              style={{ height: `${(v / max) * (h - 24)}px`, background: color }}
            />
            <div className="bar-label">{labels[i]}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

interface GroupedBarProps {
  labels: string[]
  seriesA: number[]
  seriesB: number[]
  nameA: string
  nameB: string
}

/** Two-series grouped bar chart (e.g. earned vs spent). */
export function GroupedBarChart({ labels, seriesA, seriesB, nameA, nameB }: GroupedBarProps) {
  const max = Math.max(1, ...seriesA, ...seriesB)
  const h = 120
  return (
    <div className="chart">
      <div className="chart-legend">
        <span>
          <i style={{ background: 'var(--green)' }} /> {nameA}
        </span>
        <span>
          <i style={{ background: 'var(--amber)' }} /> {nameB}
        </span>
      </div>
      <div className="bars" style={{ height: h }}>
        {labels.map((label, i) => (
          <div className="bar-col" key={i}>
            <div className="bar-pair">
              <div
                className="bar"
                title={`${nameA}: ${seriesA[i]}m`}
                style={{ height: `${(seriesA[i] / max) * (h - 24)}px`, background: 'var(--green)' }}
              />
              <div
                className="bar"
                title={`${nameB}: ${seriesB[i]}m`}
                style={{ height: `${(seriesB[i] / max) * (h - 24)}px`, background: 'var(--amber)' }}
              />
            </div>
            <div className="bar-label">{label}</div>
          </div>
        ))}
      </div>
    </div>
  )
}

interface ScatterProps {
  points: { x: number; y: number; title: string }[]
}

/** Estimated (x) vs actual (y) minutes scatter, with a y=x reference line. */
export function ScatterPlot({ points }: ScatterProps) {
  const size = 220
  const pad = 28
  const max = Math.max(10, ...points.map((p) => Math.max(p.x, p.y)))
  const sx = (v: number) => pad + (v / max) * (size - pad * 2)
  const sy = (v: number) => size - pad - (v / max) * (size - pad * 2)

  if (points.length === 0) {
    return <div className="hint" style={{ padding: '12px 0' }}>No completed tasks yet.</div>
  }

  return (
    <svg viewBox={`0 0 ${size} ${size}`} className="scatter" width="100%" style={{ maxWidth: 280 }}>
      {/* axes */}
      <line x1={pad} y1={size - pad} x2={size - pad} y2={size - pad} className="axis" />
      <line x1={pad} y1={pad} x2={pad} y2={size - pad} className="axis" />
      {/* y = x reference (perfect estimate) */}
      <line x1={sx(0)} y1={sy(0)} x2={sx(max)} y2={sy(max)} className="ref-line" />
      {points.map((p, i) => (
        <circle key={i} cx={sx(p.x)} cy={sy(p.y)} r={4} className="dot">
          <title>
            {p.title}: est {p.x}m, actual {p.y}m
          </title>
        </circle>
      ))}
      <text x={size / 2} y={size - 6} className="axis-label" textAnchor="middle">
        estimated (min)
      </text>
      <text x={10} y={size / 2} className="axis-label" textAnchor="middle" transform={`rotate(-90 10 ${size / 2})`}>
        actual (min)
      </text>
    </svg>
  )
}

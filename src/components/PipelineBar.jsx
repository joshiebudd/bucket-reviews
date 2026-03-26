import { computeTotalWeighted, formatGBP, formatGBPFull, TARGET_VALUE } from '../utils/pipeline'

export default function PipelineBar({ deals }) {
  const total = computeTotalWeighted(deals)
  const pct = Math.min((total / TARGET_VALUE) * 100, 120)
  const displayPct = (total / TARGET_VALUE) * 100

  let fillColor
  if (displayPct >= 100) fillColor = '#22c55e'
  else if (displayPct >= 70) fillColor = '#6366f1'
  else if (displayPct >= 40) fillColor = '#f59e0b'
  else fillColor = '#ef4444'

  return (
    <div className="pipeline-bar-wrap">
      <div className="pipeline-bar-labels">
        <span className="pipeline-bar-value">{formatGBPFull(total)} weighted</span>
        <span className="pipeline-bar-pct" style={{ color: fillColor }}>
          {Math.round(displayPct)}% of target
        </span>
        <span className="pipeline-bar-target">£150k target</span>
      </div>
      <div className="pipeline-bar-track">
        <div
          className="pipeline-bar-fill"
          style={{
            width: `${pct}%`,
            background: fillColor,
          }}
        />
      </div>
    </div>
  )
}

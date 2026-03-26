import { computeExpectedValue, formatGBP, formatDate, DROP_REASONS, STAGES } from '../utils/pipeline'

const REASON_LABELS = Object.fromEntries(DROP_REASONS.map(r => [r.value, r.label]))

function reasonLabel(reason) {
  return REASON_LABELS[reason] || reason
}

function reasonClass(reason) {
  return REASON_LABELS[reason] ? `reason-${reason}` : 'reason-other'
}

export default function DroppedDealsLog({ droppedDeals, onRestore }) {
  const knownReasonCounts = DROP_REASONS.map(r => ({
    ...r,
    count: droppedDeals.filter(d => d.reason === r.value).length,
  })).filter(r => r.count > 0)

  const otherCount = droppedDeals.filter(d => !REASON_LABELS[d.reason]).length

  const totalLost = droppedDeals.reduce((s, d) => s + computeExpectedValue(d), 0)

  const sorted = [...droppedDeals].sort(
    (a, b) => new Date(b.droppedAt) - new Date(a.droppedAt)
  )

  return (
    <div className="panel-view">
      <div className="panel-header">
        <h2>Dropped deals</h2>
        {droppedDeals.length > 0 && (
          <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
            {formatGBP(totalLost)} lost
          </span>
        )}
      </div>

      {droppedDeals.length === 0 ? (
        <div className="panel-empty">
          <div className="panel-empty-icon">🎯</div>
          <div>No dropped deals this session</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            Use the × button on a deal card to log a drop
          </div>
        </div>
      ) : (
        <>
          {(knownReasonCounts.length > 0 || otherCount > 0) && (
            <div className="dropped-summary">
              {knownReasonCounts.map(r => (
                <span key={r.value} className={`dropped-reason-tag reason-${r.value}`}>
                  {r.label}: {r.count}
                </span>
              ))}
              {otherCount > 0 && (
                <span className="dropped-reason-tag reason-other">
                  Other: {otherCount}
                </span>
              )}
            </div>
          )}

          <div className="dropped-log">
            {sorted.map(deal => {
              const stage = STAGES.find(s => s.id === deal.originalStage)
              return (
                <div key={deal.id} className="dropped-item">
                  <div className="dropped-item-info">
                    <div className="dropped-item-name">{deal.name}</div>
                    <div className="dropped-item-meta">
                      {stage?.label} · dropped {formatDate(deal.droppedAt)}
                    </div>
                  </div>
                  <span className={`dropped-reason-tag ${reasonClass(deal.reason)}`}>
                    {reasonLabel(deal.reason)}
                  </span>
                  <span className="dropped-item-value">
                    {formatGBP(deal.contractValue)}
                  </span>
                  <button
                    className="btn btn-ghost"
                    style={{ padding: '3px 10px', fontSize: 11, flexShrink: 0 }}
                    onClick={() => onRestore(deal)}
                    title="Restore to pipeline"
                  >
                    Restore
                  </button>
                </div>
              )
            })}
          </div>
        </>
      )}
    </div>
  )
}

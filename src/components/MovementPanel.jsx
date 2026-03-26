import { computeMovement, computeExpectedValue, formatGBP, STAGES, STAGE_COLORS, formatDate } from '../utils/pipeline'

function StageBadge({ stageId }) {
  const stage = STAGES.find(s => s.id === stageId)
  const color = STAGE_COLORS[stageId]
  return (
    <span
      className="stage-badge"
      style={{ background: `${color}22`, color, border: `1px solid ${color}44` }}
    >
      {stage?.label}
    </span>
  )
}

function MovementSection({ title, icon, items, className, renderItem }) {
  if (items.length === 0) return null
  return (
    <div className={`movement-section ${className}`}>
      <div className="movement-section-header">
        <span className="movement-section-icon">{icon}</span>
        <span className="movement-section-title">{title}</span>
        <span className="movement-section-count">{items.length}</span>
      </div>
      <div className="movement-items">
        {items.map((item, i) => renderItem(item, i))}
      </div>
    </div>
  )
}

export default function MovementPanel({ currentDeals, sessions, compareSessionId, onCompare }) {
  const compareSession = sessions.find(s => s.id === compareSessionId)

  return (
    <div className="panel-view">
      <div className="panel-header">
        <h2>Movement</h2>
      </div>

      <div className="compare-selector">
        <label>Comparing vs</label>
        <select
          value={compareSessionId || ''}
          onChange={e => onCompare(e.target.value || null)}
        >
          <option value="">— Select a session —</option>
          {[...sessions].reverse().map(s => (
            <option key={s.id} value={s.id}>
              {s.label} ({formatDate(s.savedAt)})
            </option>
          ))}
        </select>
      </div>

      {!compareSession ? (
        <div className="panel-empty">
          <div className="panel-empty-icon">📊</div>
          <div>Select a session above to see what's changed</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
            Save a snapshot first using "Save snapshot" in the header
          </div>
        </div>
      ) : (() => {
        const { newDeals, movedForward, movedBack, unchanged, missing } = computeMovement(
          currentDeals,
          compareSession.deals
        )

        const totalSections = newDeals.length + movedForward.length + movedBack.length + missing.length

        return (
          <>
            <p className="panel-subtitle">
              Changes since <strong>{compareSession.label}</strong> · {formatDate(compareSession.savedAt)}
            </p>

            {totalSections === 0 ? (
              <div className="panel-empty">
                <div className="panel-empty-icon">✓</div>
                <div>No changes since this session</div>
              </div>
            ) : (
              <>
                <MovementSection
                  title="New additions"
                  icon="✦"
                  items={newDeals}
                  className="section-new"
                  renderItem={(deal, i) => (
                    <div key={deal.id} className="movement-item">
                      <span className="movement-item-name">{deal.name}</span>
                      <StageBadge stageId={deal.stage} />
                      <span className="movement-item-value">{formatGBP(computeExpectedValue(deal))}</span>
                    </div>
                  )}
                />

                <MovementSection
                  title="Moved forward"
                  icon="↑"
                  items={movedForward}
                  className="section-forward"
                  renderItem={({ current, previous }, i) => (
                    <div key={current.id} className="movement-item">
                      <span className="movement-item-name">{current.name}</span>
                      <div className="stage-arrow">
                        <StageBadge stageId={previous.stage} />
                        <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>→</span>
                        <StageBadge stageId={current.stage} />
                      </div>
                      <span className="movement-item-value">{formatGBP(computeExpectedValue(current))}</span>
                    </div>
                  )}
                />

                <MovementSection
                  title="Moved back"
                  icon="↓"
                  items={movedBack}
                  className="section-back"
                  renderItem={({ current, previous }, i) => (
                    <div key={current.id} className="movement-item">
                      <span className="movement-item-name">{current.name}</span>
                      <div className="stage-arrow">
                        <StageBadge stageId={previous.stage} />
                        <span style={{ color: 'var(--text-muted)', fontSize: 10 }}>→</span>
                        <StageBadge stageId={current.stage} />
                      </div>
                      <span className="movement-item-value">{formatGBP(computeExpectedValue(current))}</span>
                    </div>
                  )}
                />

                <MovementSection
                  title="Missing from pipeline"
                  icon="?"
                  items={missing}
                  className="section-missing"
                  renderItem={(deal, i) => (
                    <div key={deal.id} className="movement-item">
                      <span className="movement-item-name" style={{ color: 'var(--text-muted)' }}>
                        {deal.name}
                      </span>
                      <StageBadge stageId={deal.stage} />
                      <span className="movement-item-value" style={{ color: 'var(--text-muted)' }}>
                        {formatGBP(computeExpectedValue(deal))}
                      </span>
                    </div>
                  )}
                />
              </>
            )}
          </>
        )
      })()}
    </div>
  )
}

import { useState } from 'react'
import { formatDate, formatGBP, computeTotalWeighted } from '../utils/pipeline'

export default function SessionPanel({
  sessions,
  compareSessionId,
  onSave,
  onStartNew,
  onCompare,
  onDeleteSession,
  onImport,
}) {
  const [open, setOpen] = useState(false)

  const compareSession = sessions.find(s => s.id === compareSessionId)

  function handleBackdrop(e) {
    if (e.target === e.currentTarget) setOpen(false)
  }

  return (
    <div className="session-panel">
      {compareSession && (
        <span
          style={{
            fontSize: 11,
            color: '#818cf8',
            background: 'rgba(99,102,241,0.1)',
            padding: '3px 8px',
            borderRadius: 10,
            border: '1px solid rgba(99,102,241,0.2)',
          }}
        >
          Comparing: {compareSession.label}
        </span>
      )}

      <div className="session-history-dropdown">
        <button className="btn btn-ghost" onClick={() => setOpen(o => !o)}>
          History {sessions.length > 0 && `(${sessions.length})`} ↓
        </button>

        {open && (
          <>
            <div
              style={{ position: 'fixed', inset: 0, zIndex: 99 }}
              onClick={() => setOpen(false)}
            />
            <div className="session-history-menu" style={{ zIndex: 100 }}>
              <div className="session-history-header">Session history</div>

              {sessions.length === 0 ? (
                <div className="session-history-empty">No saved sessions yet</div>
              ) : (
                <div className="session-history-list">
                  {[...sessions].reverse().map(session => (
                    <div
                      key={session.id}
                      className={`session-item ${compareSessionId === session.id ? 'is-comparing' : ''}`}
                    >
                      <div className="session-item-info">
                        <div className="session-item-label">{session.label}</div>
                        <div className="session-item-meta">
                          {formatDate(session.savedAt)} · {session.deals.length} deals ·{' '}
                          {formatGBP(computeTotalWeighted(session.deals))} weighted
                        </div>
                      </div>
                      <div className="session-item-actions">
                        {compareSessionId === session.id ? (
                          <span className="session-compare-badge">Comparing</span>
                        ) : (
                          <button
                            className="btn btn-ghost"
                            style={{ padding: '3px 8px', fontSize: 11 }}
                            onClick={() => {
                              onCompare(session.id)
                              setOpen(false)
                            }}
                          >
                            Compare
                          </button>
                        )}
                        {compareSessionId === session.id && (
                          <button
                            className="btn btn-ghost"
                            style={{ padding: '3px 8px', fontSize: 11 }}
                            onClick={() => {
                              onCompare(null)
                              setOpen(false)
                            }}
                          >
                            Clear
                          </button>
                        )}
                        <button
                          className="btn btn-ghost"
                          style={{ padding: '3px 8px', fontSize: 11, color: '#f87171', borderColor: 'rgba(248,113,113,0.3)' }}
                          onClick={() => onDeleteSession(session.id)}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      <button
        className="btn"
        onClick={onImport}
        title="Import deals from Attio GTM Pipeline"
        style={{ color: '#818cf8', borderColor: 'rgba(129,140,248,0.4)' }}
      >
        ↓ Attio
      </button>

      <button className="btn" onClick={onSave}>
        Save snapshot
      </button>

      <button className="btn btn-primary" onClick={onStartNew}>
        New session →
      </button>
    </div>
  )
}

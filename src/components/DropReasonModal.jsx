import { useState } from 'react'
import { DROP_REASONS } from '../utils/pipeline'

export default function DropReasonModal({ deal, onConfirm, onCancel }) {
  const [selected, setSelected] = useState(null)
  const [customReason, setCustomReason] = useState('')

  const isOther = selected === 'other'
  const canConfirm = selected && (!isOther || customReason.trim())
  const confirmValue = isOther ? customReason.trim() : selected

  function handleBackdrop(e) {
    if (e.target === e.currentTarget) onCancel()
  }

  return (
    <div className="modal-backdrop" onClick={handleBackdrop}>
      <div className="modal">
        <h2>Drop deal</h2>
        <p>
          Mark <span className="drop-modal-deal-name">"{deal.name}"</span> as dropped.
          Select a reason:
        </p>

        <div className="drop-reasons">
          {DROP_REASONS.map(r => (
            <button
              key={r.value}
              className={`drop-reason-btn ${selected === r.value ? 'selected' : ''}`}
              onClick={() => setSelected(r.value)}
            >
              {r.label}
            </button>
          ))}
          <button
            className={`drop-reason-btn ${isOther ? 'selected' : ''}`}
            onClick={() => setSelected('other')}
            style={{ gridColumn: '1 / -1' }}
          >
            Other…
          </button>
        </div>

        {isOther && (
          <input
            type="text"
            placeholder="Describe the reason"
            value={customReason}
            onChange={e => setCustomReason(e.target.value)}
            autoFocus
            style={{
              width: '100%',
              padding: '8px 10px',
              background: 'var(--bg-app)',
              border: '1px solid var(--accent)',
              borderRadius: 'var(--radius-sm)',
              color: 'var(--text-primary)',
              fontFamily: 'var(--font)',
              fontSize: 13,
              outline: 'none',
              marginBottom: 16,
            }}
            onKeyDown={e => e.key === 'Enter' && canConfirm && onConfirm(confirmValue)}
          />
        )}

        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onCancel}>
            Cancel
          </button>
          <button
            className="btn btn-danger"
            disabled={!canConfirm}
            style={canConfirm ? { background: 'rgba(239,68,68,0.1)', borderColor: '#f87171', color: '#f87171' } : {}}
            onClick={() => canConfirm && onConfirm(confirmValue)}
          >
            Confirm drop
          </button>
        </div>
      </div>
    </div>
  )
}

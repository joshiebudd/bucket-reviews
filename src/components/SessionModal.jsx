import { useState } from 'react'

export default function SessionModal({ action, onConfirm, onCancel }) {
  const defaultLabel = new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
  const [label, setLabel] = useState(defaultLabel)

  function handleBackdrop(e) {
    if (e.target === e.currentTarget) onCancel()
  }

  function handleSubmit(e) {
    e.preventDefault()
    onConfirm(label.trim() || defaultLabel)
  }

  const isNew = action === 'new'

  return (
    <div className="modal-backdrop" onClick={handleBackdrop}>
      <div className="modal">
        <h2>{isNew ? 'Start new session' : 'Save session'}</h2>
        <p>
          {isNew
            ? 'Current deals will carry forward. This session will be archived so you can compare against it later.'
            : 'A snapshot of the current pipeline will be saved. You can compare against it in the Movement view.'}
        </p>

        <form onSubmit={handleSubmit}>
          <label>Session label</label>
          <input
            type="text"
            value={label}
            onChange={e => setLabel(e.target.value)}
            autoFocus
            onFocus={e => e.target.select()}
          />
          <div className="modal-actions">
            <button type="button" className="btn btn-ghost" onClick={onCancel}>
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              {isNew ? 'Start new session' : 'Save snapshot'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

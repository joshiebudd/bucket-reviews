export default function HelpModal({ onClose }) {
  function handleBackdrop(e) {
    if (e.target === e.currentTarget) onClose()
  }

  return (
    <div className="modal-backdrop" onClick={handleBackdrop}>
      <div className="modal" style={{ width: 420 }}>
        <h2 style={{ marginBottom: 16 }}>How this works</h2>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 12, marginBottom: 20 }}>
          <HelpItem icon="📋" title="Track deals across 5 stages">
            Each deal has a contract value and a confidence %. The weighted expected value
            (value × confidence) is what counts toward the £150k target.
          </HelpItem>
          <HelpItem icon="✏️" title="Edit everything inline">
            Click any field on a deal card to edit it live — name, value, confidence, or notes.
            Drag the ⠿ handle to move a deal to a different stage.
          </HelpItem>
          <HelpItem icon="📸" title="Save snapshots">
            Hit <strong>Save snapshot</strong> at any point to archive the current pipeline.
            Use <strong>New session →</strong> at the start of a new period — it archives the
            current state and carries deals forward.
          </HelpItem>
          <HelpItem icon="📊" title="Review what changed">
            The <strong>Movement</strong> tab compares your current pipeline against any saved
            snapshot — showing what moved forward, what's new, and what's gone missing.
          </HelpItem>
          <HelpItem icon="🗑️" title="Log dropped deals">
            Use the × on a card to drop a deal with a reason (Ghosted, Lost Interest, Not Ready,
            Wrong Fit). Find the full log in the <strong>Dropped</strong> tab.
          </HelpItem>
        </div>

        <div className="modal-actions">
          <button className="btn btn-primary" onClick={onClose}>Got it</button>
        </div>
      </div>
    </div>
  )
}

function HelpItem({ icon, title, children }) {
  return (
    <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
      <span style={{ fontSize: 18, flexShrink: 0, marginTop: 1 }}>{icon}</span>
      <div>
        <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-primary)', marginBottom: 2 }}>
          {title}
        </div>
        <div style={{ fontSize: 12, color: 'var(--text-secondary)', lineHeight: 1.5 }}>
          {children}
        </div>
      </div>
    </div>
  )
}

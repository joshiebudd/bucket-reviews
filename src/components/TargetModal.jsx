import { useState, Fragment } from 'react'

const DEADLINE = '20 Apr 2026'

export default function TargetModal({ targets, onSave, onCancel }) {
  const [form, setForm] = useState({
    kdmMeetings:      { base: targets?.kdmMeetings?.base      ?? '', stretch: targets?.kdmMeetings?.stretch      ?? '' },
    annualContracts:  { base: targets?.annualContracts?.base  ?? '', stretch: targets?.annualContracts?.stretch  ?? '' },
    totalValue:       { base: targets?.totalValue?.base       ?? '', stretch: targets?.totalValue?.stretch       ?? '' },
  })

  function set(metric, kind, val) {
    setForm(f => ({ ...f, [metric]: { ...f[metric], [kind]: val } }))
  }

  function handleSave() {
    onSave({
      kdmMeetings:     { base: Number(form.kdmMeetings.base)     || 0, stretch: Number(form.kdmMeetings.stretch)     || 0 },
      annualContracts: { base: Number(form.annualContracts.base) || 0, stretch: Number(form.annualContracts.stretch) || 0 },
      totalValue:      { base: Number(form.totalValue.base)      || 0, stretch: Number(form.totalValue.stretch)      || 0 },
    })
  }

  function handleBackdrop(e) {
    if (e.target === e.currentTarget) onCancel()
  }

  const rows = [
    { key: 'kdmMeetings',     label: 'Meetings with KDM',   prefix: '',  type: 'number' },
    { key: 'annualContracts', label: 'Annual contracts',     prefix: '',  type: 'number' },
    { key: 'totalValue',      label: 'Total contract value', prefix: '£', type: 'number' },
  ]

  return (
    <div className="modal-backdrop" onClick={handleBackdrop}>
      <div className="modal" style={{ width: 440 }}>
        <h2>90-day targets</h2>
        <p style={{ marginBottom: 20 }}>
          Set base and stretch targets for execution ending <strong>{DEADLINE}</strong>.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '6px 10px', marginBottom: 20 }}>
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }} />
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Base</div>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#818cf8', textTransform: 'uppercase', letterSpacing: '0.05em', textAlign: 'center' }}>Stretch</div>

          {rows.map(r => (
            <Fragment key={r.key}>
              <div style={{ fontSize: 13, color: 'var(--text-secondary)', display: 'flex', alignItems: 'center' }}>{r.label}</div>
              <div style={{ position: 'relative' }}>
                {r.prefix && <span style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--text-muted)' }}>{r.prefix}</span>}
                <input
                  type="number"
                  min="0"
                  value={form[r.key].base}
                  onChange={e => set(r.key, 'base', e.target.value)}
                  style={{ width: '100%', marginBottom: 0, paddingLeft: r.prefix ? 20 : undefined, textAlign: 'right' }}
                  placeholder="0"
                />
              </div>
              <div style={{ position: 'relative' }}>
                {r.prefix && <span style={{ position: 'absolute', left: 8, top: '50%', transform: 'translateY(-50%)', fontSize: 13, color: 'var(--text-muted)' }}>{r.prefix}</span>}
                <input
                  type="number"
                  min="0"
                  value={form[r.key].stretch}
                  onChange={e => set(r.key, 'stretch', e.target.value)}
                  style={{ width: '100%', marginBottom: 0, paddingLeft: r.prefix ? 20 : undefined, textAlign: 'right', borderColor: 'rgba(129,140,248,0.4)' }}
                  placeholder="0"
                />
              </div>
            </Fragment>
          ))}
        </div>

        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
          <button className="btn btn-primary" onClick={handleSave}>Save targets</button>
        </div>
      </div>
    </div>
  )
}

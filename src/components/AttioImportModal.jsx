import { useState } from 'react'
import { getStoredApiKey, saveApiKey, fetchAttioPipelineLists, importFromAttio } from '../utils/attio'
import { STAGES, STAGE_COLORS, formatGBP } from '../utils/pipeline'

export default function AttioImportModal({ onImport, onCancel }) {
  const [apiKey, setApiKey] = useState(getStoredApiKey)
  const [step, setStep] = useState('key') // key | picking | fetching | preview | error
  const [lists, setLists] = useState([])
  const [selectedListId, setSelectedListId] = useState('')
  const [selectedListType, setSelectedListType] = useState('list')
  const [preview, setPreview] = useState(null)
  const [error, setError] = useState('')

  function handleBackdrop(e) {
    if (e.target === e.currentTarget) onCancel()
  }

  async function handleFetchLists() {
    if (!apiKey.trim()) return
    setStep('fetching')
    setError('')
    try {
      saveApiKey(apiKey.trim())
      const available = await fetchAttioPipelineLists(apiKey.trim())
      if (available.length === 0) throw new Error('No objects found in this Attio workspace.')
      setLists(available)
      // Auto-select deals object, or first available
      const auto = available.find(l =>
        ['deals', 'deal', 'gtm', 'pipeline'].some(k => l.name.toLowerCase().includes(k) || l.id.toLowerCase().includes(k))
      )
      const selected = auto || available[0]
      setSelectedListId(selected.id)
      setSelectedListType(selected.type)
      setStep('picking')
    } catch (e) {
      setError(e.message)
      setStep('error')
    }
  }

  async function handleFetchDeals() {
    if (!selectedListId) return
    setStep('fetching')
    setError('')
    try {
      const deals = await importFromAttio(apiKey.trim(), selectedListId, selectedListType)
      setPreview(deals)
      setStep('preview')
    } catch (e) {
      setError(e.message)
      setStep('error')
    }
  }

  const stageCounts = preview
    ? STAGES.map(s => ({
        ...s,
        count: preview.filter(d => d.stage === s.id).length,
        total: preview.filter(d => d.stage === s.id).reduce((sum, d) => sum + d.contractValue, 0),
      })).filter(s => s.count > 0)
    : []

  return (
    <div className="modal-backdrop" onClick={handleBackdrop}>
      <div className="modal" style={{ width: 460 }}>
        <h2>Import from Attio</h2>
        <p>
          Fetches all deals from your GTM Pipeline (Active Conversation → Annual Contract) and
          replaces the current pipeline. Confidence defaults to 50% — adjust after import.
        </p>

        <label>Attio API key</label>
        <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
          <input
            type="password"
            value={apiKey}
            onChange={e => { setApiKey(e.target.value); setStep('key') }}
            placeholder="paste your API key…"
            onKeyDown={e => e.key === 'Enter' && handleFetchLists()}
            style={{ flex: 1, marginBottom: 0 }}
          />
          <button
            className="btn btn-primary"
            onClick={handleFetchLists}
            disabled={!apiKey.trim() || step === 'fetching'}
            style={{ flexShrink: 0 }}
          >
            {step === 'fetching' && !lists.length ? 'Connecting…' : 'Connect'}
          </button>
        </div>

        {(step === 'picking' || step === 'preview') && (
          <>
            <label>Select list</label>
            <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
              <select
                value={selectedListId}
                onChange={e => {
                const picked = lists.find(l => l.id === e.target.value)
                setSelectedListId(e.target.value)
                setSelectedListType(picked?.type || 'object')
                setStep('picking')
              }}
                style={{
                  flex: 1,
                  padding: '8px 10px',
                  background: 'var(--bg-app)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius-sm)',
                  color: 'var(--text-primary)',
                  fontFamily: 'var(--font)',
                  fontSize: 13,
                  outline: 'none',
                  marginBottom: 0,
                }}
              >
                {lists.map(l => (
                  <option key={l.id} value={l.id}>{l.name}</option>
                ))}
              </select>
              <button
                className="btn btn-primary"
                onClick={handleFetchDeals}
                disabled={!selectedListId || step === 'fetching'}
                style={{ flexShrink: 0 }}
              >
                {step === 'fetching' ? 'Fetching…' : 'Fetch deals'}
              </button>
            </div>
          </>
        )}

        {step === 'error' && (
          <div style={{
            padding: '10px 12px',
            background: 'rgba(239,68,68,0.1)',
            border: '1px solid rgba(239,68,68,0.3)',
            borderRadius: 'var(--radius-sm)',
            color: '#f87171',
            fontSize: 12,
            marginBottom: 16,
            wordBreak: 'break-all',
          }}>
            {error}
          </div>
        )}

        {step === 'preview' && preview && (
          <div style={{ marginBottom: 16 }}>
            <div style={{
              fontSize: 11,
              fontWeight: 600,
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: 'var(--text-muted)',
              marginBottom: 8,
            }}>
              Preview — {preview.length} deals
            </div>
            {preview.length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '8px 0' }}>
                No deals found in the mapped stages. Check the console for skipped entries.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                {stageCounts.map(s => (
                  <div key={s.id} style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 10,
                    padding: '7px 10px',
                    background: 'var(--bg-raised)',
                    borderRadius: 'var(--radius-sm)',
                    borderLeft: `3px solid ${STAGE_COLORS[s.id]}`,
                  }}>
                    <span style={{ flex: 1, fontSize: 12, fontWeight: 500 }}>{s.label}</span>
                    <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>{s.count} deals</span>
                    {s.total > 0 && (
                      <span style={{ fontSize: 11, fontWeight: 600, color: STAGE_COLORS[s.id] }}>
                        {formatGBP(s.total)}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        <div className="modal-actions">
          <button className="btn btn-ghost" onClick={onCancel}>Cancel</button>
          {step === 'preview' && preview?.length > 0 && (
            <button className="btn btn-primary" onClick={() => onImport(preview)}>
              Replace pipeline ({preview.length} deals)
            </button>
          )}
        </div>
      </div>
    </div>
  )
}

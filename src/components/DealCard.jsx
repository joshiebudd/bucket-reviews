import { useState, useEffect, useRef } from 'react'
import { useDraggable } from '@dnd-kit/core'
import { computeExpectedValue, formatGBP, STAGE_COLORS } from '../utils/pipeline'

function confidenceColor(conf) {
  if (conf >= 70) return '#22c55e'
  if (conf >= 35) return '#f59e0b'
  return '#ef4444'
}

export default function DealCard({ deal, stageColor, onUpdate, onDropDeal, isOverlay }) {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: deal.id,
    disabled: isOverlay,
  })

  const [editingField, setEditingField] = useState(null)
  const [localDeal, setLocalDeal] = useState(deal)
  const nameRef = useRef(null)
  const valueRef = useRef(null)
  const notesRef = useRef(null)

  useEffect(() => {
    setLocalDeal(deal)
  }, [deal.id])

  useEffect(() => {
    if (editingField === 'name') nameRef.current?.focus()
    if (editingField === 'contractValue') valueRef.current?.focus()
    if (editingField === 'notes') notesRef.current?.focus()
  }, [editingField])

  const style = transform
    ? { transform: `translate3d(${transform.x}px, ${transform.y}px, 0)` }
    : undefined

  function commit(field, value) {
    const updated = { ...localDeal, [field]: value }
    setLocalDeal(updated)
    onUpdate(deal.id, { [field]: value })
    setEditingField(null)
  }

  function handleKeyDown(e, field) {
    if (e.key === 'Enter' && field !== 'notes') {
      e.preventDefault()
      commit(field, localDeal[field])
    }
    if (e.key === 'Escape') {
      setLocalDeal(deal)
      setEditingField(null)
    }
  }

  const expectedVal = computeExpectedValue(localDeal)
  const confColor = confidenceColor(localDeal.confidence)

  return (
    <div
      ref={setNodeRef}
      style={{ ...style, '--stage-color': stageColor }}
      className={`deal-card deal-card-enter ${isDragging ? 'is-dragging-source' : ''} ${isOverlay ? 'is-overlay' : ''}`}
    >
      <div className="deal-card-header">
        <div className="drag-handle" {...listeners} {...attributes} title="Drag to move stage">
          ⠿
        </div>

        <div className="deal-name-area">
          {editingField === 'name' ? (
            <input
              ref={nameRef}
              className="deal-name-input"
              value={localDeal.name}
              onChange={e => setLocalDeal(d => ({ ...d, name: e.target.value }))}
              onBlur={() => commit('name', localDeal.name)}
              onKeyDown={e => handleKeyDown(e, 'name')}
            />
          ) : (
            <span
              className="deal-name-display"
              onClick={() => setEditingField('name')}
              title="Click to edit"
            >
              {localDeal.name || <em style={{ color: 'var(--text-muted)' }}>Unnamed deal</em>}
            </span>
          )}
        </div>

        <button
          className="deal-drop-btn"
          onClick={() => onDropDeal(deal)}
          title="Drop this deal"
        >
          ×
        </button>
      </div>

      <div className="deal-values">
        {editingField === 'contractValue' ? (
          <input
            ref={valueRef}
            type="number"
            min="0"
            className="deal-value-input"
            value={localDeal.contractValue}
            onChange={e => setLocalDeal(d => ({ ...d, contractValue: parseFloat(e.target.value) || 0 }))}
            onBlur={() => commit('contractValue', localDeal.contractValue)}
            onKeyDown={e => handleKeyDown(e, 'contractValue')}
          />
        ) : (
          <span
            className="deal-contract-value"
            onClick={() => setEditingField('contractValue')}
            title="Click to edit contract value"
          >
            {formatGBP(localDeal.contractValue)}
          </span>
        )}

        <span className="deal-value-sep">×</span>

        <div className="deal-confidence-area">
          {editingField === 'confidence' ? (
            <div className="deal-confidence-slider-wrap">
              <input
                type="range"
                min="0"
                max="100"
                step="10"
                className="deal-confidence-slider"
                value={localDeal.confidence}
                onChange={e => setLocalDeal(d => ({ ...d, confidence: parseInt(e.target.value) }))}
                onBlur={() => commit('confidence', localDeal.confidence)}
                onKeyDown={e => {
                  if (e.key === 'Enter') commit('confidence', localDeal.confidence)
                  if (e.key === 'Escape') { setLocalDeal(deal); setEditingField(null) }
                }}
                autoFocus
              />
              <span className="deal-confidence-val" style={{ color: confColor }}>
                {localDeal.confidence}%
              </span>
            </div>
          ) : (
            <span
              className="deal-confidence-badge"
              style={{ background: `${confColor}22`, color: confColor, border: `1px solid ${confColor}44` }}
              onClick={() => setEditingField('confidence')}
              title="Click to edit confidence"
            >
              {localDeal.confidence}%
            </span>
          )}
        </div>

        <span className="deal-expected">
          = <strong>{formatGBP(expectedVal)}</strong>
        </span>
      </div>

      <div className="deal-notes-area">
        {editingField === 'notes' ? (
          <textarea
            ref={notesRef}
            className="deal-notes-input"
            value={localDeal.notes}
            onChange={e => setLocalDeal(d => ({ ...d, notes: e.target.value }))}
            onBlur={() => commit('notes', localDeal.notes)}
            onKeyDown={e => handleKeyDown(e, 'notes')}
            placeholder="Add notes..."
          />
        ) : (
          <div
            className={`deal-notes-display ${!localDeal.notes ? 'empty' : ''}`}
            onClick={() => setEditingField('notes')}
            title="Click to add notes"
          >
            {localDeal.notes || 'Add notes...'}
          </div>
        )}
      </div>
    </div>
  )
}

import { useState } from 'react'
import { useDroppable } from '@dnd-kit/core'
import DealCard from './DealCard'
import { computeExpectedValue, computeTotalWeighted, formatGBP, STAGE_COLORS } from '../utils/pipeline'

function AddDealForm({ stageColor, onAdd, onCancel }) {
  const [name, setName] = useState('')
  const [contractValue, setContractValue] = useState('')
  const [confidence, setConfidence] = useState('50')

  function handleSubmit(e) {
    e.preventDefault()
    if (!name.trim()) return
    onAdd({
      name: name.trim(),
      contractValue: parseFloat(contractValue) || 0,
      confidence: parseInt(confidence) || 50,
    })
  }

  return (
    <form className="inline-add-form" onSubmit={handleSubmit}>
      <input
        type="text"
        placeholder="Deal name"
        value={name}
        onChange={e => setName(e.target.value)}
        autoFocus
      />
      <div className="inline-add-form-row">
        <input
          type="number"
          placeholder="Value (£)"
          min="0"
          value={contractValue}
          onChange={e => setContractValue(e.target.value)}
        />
        <input
          type="number"
          placeholder="Conf %"
          min="0"
          max="100"
          value={confidence}
          onChange={e => setConfidence(e.target.value)}
        />
      </div>
      <div className="inline-add-form-actions">
        <button type="button" className="btn btn-ghost" onClick={onCancel}>
          Cancel
        </button>
        <button type="submit" className="btn btn-primary" disabled={!name.trim()}>
          Add
        </button>
      </div>
    </form>
  )
}

export default function BucketColumn({ stage, deals, onAddDeal, onUpdateDeal, onDropDeal }) {
  const [showAddForm, setShowAddForm] = useState(false)
  const stageColor = STAGE_COLORS[stage.id]

  const { setNodeRef, isOver } = useDroppable({
    id: String(stage.id),
  })

  const totalExpected = computeTotalWeighted(deals)
  const totalContract = deals.reduce((s, d) => s + d.contractValue, 0)

  function handleAdd(data) {
    onAddDeal(data)
    setShowAddForm(false)
  }

  return (
    <div
      ref={setNodeRef}
      className={`bucket-column ${isOver ? 'is-over' : ''}`}
      style={{ '--stage-color': stageColor, '--drop-color': stageColor }}
    >
      <div className="bucket-header" style={{ borderTopColor: stageColor }}>
        <div className="bucket-header-top">
          <span className="bucket-stage-name">{stage.label}</span>
          <span className="bucket-count">{deals.length}</span>
        </div>
        <div className="bucket-stats">
          <div className="bucket-stat">
            <span className="bucket-stat-label">Contract</span>
            <span className="bucket-stat-value">{formatGBP(totalContract)}</span>
          </div>
          <div className="bucket-stat">
            <span className="bucket-stat-label">Weighted</span>
            <span className="bucket-stat-value expected">{formatGBP(totalExpected)}</span>
          </div>
        </div>
      </div>

      <div className="bucket-cards">
        {deals.map(deal => (
          <DealCard
            key={deal.id}
            deal={deal}
            stageColor={stageColor}
            onUpdate={onUpdateDeal}
            onDropDeal={onDropDeal}
          />
        ))}
        {showAddForm && (
          <AddDealForm
            stageColor={stageColor}
            onAdd={handleAdd}
            onCancel={() => setShowAddForm(false)}
          />
        )}
      </div>

      <div className="bucket-footer">
        {!showAddForm && (
          <button className="bucket-add-btn" onClick={() => setShowAddForm(true)}>
            + Add deal
          </button>
        )}
      </div>
    </div>
  )
}

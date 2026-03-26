import { useReducer, useEffect, useState } from 'react'
import { DndContext, DragOverlay, closestCenter } from '@dnd-kit/core'
import { loadState, saveState } from './utils/storage'
import { STAGES, STAGE_COLORS, generateId } from './utils/pipeline'
import PipelineBar from './components/PipelineBar'
import BucketColumn from './components/BucketColumn'
import DealCard from './components/DealCard'
import SessionPanel from './components/SessionPanel'
import SessionModal from './components/SessionModal'
import MovementPanel from './components/MovementPanel'
import DroppedDealsLog from './components/DroppedDealsLog'
import DropReasonModal from './components/DropReasonModal'
import HelpModal from './components/HelpModal'
import AttioImportModal from './components/AttioImportModal'
import TargetsView from './components/TargetsView'

function reducer(state, action) {
  switch (action.type) {
    case 'ADD_DEAL': {
      const deal = {
        id: generateId(),
        name: action.payload.name,
        stage: action.payload.stage,
        contractValue: action.payload.contractValue,
        confidence: action.payload.confidence,
        notes: action.payload.notes || '',
        createdAt: new Date().toISOString(),
      }
      return { ...state, deals: [...state.deals, deal] }
    }

    case 'UPDATE_DEAL': {
      return {
        ...state,
        deals: state.deals.map(d =>
          d.id === action.payload.id ? { ...d, ...action.payload.changes } : d
        ),
      }
    }

    case 'MOVE_DEAL': {
      return {
        ...state,
        deals: state.deals.map(d =>
          d.id === action.payload.dealId ? { ...d, stage: action.payload.newStage } : d
        ),
      }
    }

    case 'DROP_DEAL': {
      const deal = state.deals.find(d => d.id === action.payload.dealId)
      if (!deal) return state
      const dropped = {
        id: generateId(),
        name: deal.name,
        contractValue: deal.contractValue,
        confidence: deal.confidence,
        reason: action.payload.reason,
        notes: deal.notes,
        droppedAt: new Date().toISOString(),
        originalStage: deal.stage,
      }
      return {
        ...state,
        deals: state.deals.filter(d => d.id !== deal.id),
        droppedDeals: [...state.droppedDeals, dropped],
      }
    }

    case 'IMPORT_DEALS': {
      const imported = action.payload.map(d => ({
        ...d,
        id: generateId(),
        notes: d.notes || '',
        createdAt: new Date().toISOString(),
      }))
      return { ...state, deals: imported }
    }

    case 'RESTORE_DEAL': {
      const dropped = state.droppedDeals.find(d => d.id === action.payload.id)
      if (!dropped) return state
      const restored = {
        id: generateId(),
        name: dropped.name,
        stage: dropped.originalStage,
        contractValue: dropped.contractValue,
        confidence: dropped.confidence,
        notes: dropped.notes || '',
        createdAt: new Date().toISOString(),
      }
      return {
        ...state,
        deals: [...state.deals, restored],
        droppedDeals: state.droppedDeals.filter(d => d.id !== dropped.id),
      }
    }

    case 'SAVE_SESSION': {
      const session = {
        id: generateId(),
        label: action.payload.label,
        savedAt: new Date().toISOString(),
        deals: JSON.parse(JSON.stringify(state.deals)),
        droppedDeals: JSON.parse(JSON.stringify(state.droppedDeals)),
      }
      return { ...state, sessions: [...state.sessions, session] }
    }

    case 'START_NEW_SESSION': {
      const session = {
        id: generateId(),
        label: action.payload.label,
        savedAt: new Date().toISOString(),
        deals: JSON.parse(JSON.stringify(state.deals)),
        droppedDeals: JSON.parse(JSON.stringify(state.droppedDeals)),
      }
      return {
        ...state,
        sessions: [...state.sessions, session],
        droppedDeals: [],
        compareSessionId: session.id,
      }
    }

    case 'SET_COMPARE': {
      return { ...state, compareSessionId: action.payload }
    }

    case 'SET_TARGETS': {
      return { ...state, targets: action.payload }
    }

    default:
      return state
  }
}

export default function App() {
  const [state, dispatch] = useReducer(reducer, null, loadState)
  const [activeCard, setActiveCard] = useState(null)
  const [pendingDropDeal, setPendingDropDeal] = useState(null)
  const [sessionModal, setSessionModal] = useState(null)
  const [showHelp, setShowHelp] = useState(false)
  const [showAttioImport, setShowAttioImport] = useState(false)
  const [view, setView] = useState('pipeline')

  useEffect(() => {
    saveState(state)
  }, [state])

  function handleDragStart(event) {
    const deal = state.deals.find(d => d.id === event.active.id)
    setActiveCard(deal || null)
  }

  function handleDragEnd(event) {
    setActiveCard(null)
    const { active, over } = event
    if (!over) return
    const newStage = parseInt(over.id)
    if (!isNaN(newStage)) {
      dispatch({ type: 'MOVE_DEAL', payload: { dealId: active.id, newStage } })
    }
  }

  function handleSessionConfirm(label) {
    if (sessionModal === 'save') {
      dispatch({ type: 'SAVE_SESSION', payload: { label } })
    } else if (sessionModal === 'new') {
      dispatch({ type: 'START_NEW_SESSION', payload: { label } })
      setView('pipeline')
    }
    setSessionModal(null)
  }

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-brand">
          <button
            className="btn btn-ghost"
            onClick={() => setShowHelp(true)}
            title="How this works"
            style={{ padding: '3px 8px', fontSize: 12, borderRadius: '50%', width: 24, height: 24, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            ?
          </button>
        </div>

        <PipelineBar deals={state.deals} />

        <nav className="view-tabs">
          {['pipeline', 'movement', 'dropped', 'targets'].map(v => (
            <button
              key={v}
              className={`tab ${view === v ? 'active' : ''}`}
              onClick={() => setView(v)}
            >
              {v === 'pipeline' ? 'Pipeline'
                : v === 'movement' ? 'Movement'
                : v === 'dropped' ? 'Dropped'
                : 'Targets'}
              {v === 'dropped' && state.droppedDeals.length > 0 && (
                <span style={{
                  marginLeft: 4,
                  background: 'rgba(239,68,68,0.2)',
                  color: '#f87171',
                  borderRadius: 10,
                  padding: '0 5px',
                  fontSize: 10,
                  fontWeight: 600,
                }}>
                  {state.droppedDeals.length}
                </span>
              )}
            </button>
          ))}
        </nav>

        <SessionPanel
          sessions={state.sessions}
          compareSessionId={state.compareSessionId}
          onSave={() => setSessionModal('save')}
          onStartNew={() => setSessionModal('new')}
          onCompare={id => dispatch({ type: 'SET_COMPARE', payload: id })}
          onImport={() => setShowAttioImport(true)}
        />
      </header>

      <main className="main-content">
        {view === 'pipeline' && (
          <DndContext
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            collisionDetection={closestCenter}
          >
            <div className="board">
              {STAGES.map(stage => (
                <BucketColumn
                  key={stage.id}
                  stage={stage}
                  deals={state.deals.filter(d => d.stage === stage.id)}
                  onAddDeal={data =>
                    dispatch({ type: 'ADD_DEAL', payload: { ...data, stage: stage.id } })
                  }
                  onUpdateDeal={(id, changes) =>
                    dispatch({ type: 'UPDATE_DEAL', payload: { id, changes } })
                  }
                  onDropDeal={deal => setPendingDropDeal(deal)}
                />
              ))}
            </div>

            <DragOverlay>
              {activeCard && (
                <DealCard
                  deal={activeCard}
                  stageColor={STAGE_COLORS[activeCard.stage]}
                  onUpdate={() => {}}
                  onDropDeal={() => {}}
                  isOverlay
                />
              )}
            </DragOverlay>
          </DndContext>
        )}

        {view === 'movement' && (
          <MovementPanel
            currentDeals={state.deals}
            sessions={state.sessions}
            compareSessionId={state.compareSessionId}
            onCompare={id => dispatch({ type: 'SET_COMPARE', payload: id })}
          />
        )}

        {view === 'dropped' && (
          <DroppedDealsLog
            droppedDeals={state.droppedDeals}
            onRestore={deal => dispatch({ type: 'RESTORE_DEAL', payload: { id: deal.id } })}
          />
        )}

        {view === 'targets' && (
          <TargetsView
            targets={state.targets}
            onUpdate={t => dispatch({ type: 'SET_TARGETS', payload: t })}
          />
        )}
      </main>

      {pendingDropDeal && (
        <DropReasonModal
          deal={pendingDropDeal}
          onConfirm={reason => {
            dispatch({ type: 'DROP_DEAL', payload: { dealId: pendingDropDeal.id, reason } })
            setPendingDropDeal(null)
          }}
          onCancel={() => setPendingDropDeal(null)}
        />
      )}

      {sessionModal && (
        <SessionModal
          action={sessionModal}
          onConfirm={handleSessionConfirm}
          onCancel={() => setSessionModal(null)}
        />
      )}

      {showHelp && <HelpModal onClose={() => setShowHelp(false)} />}

      {showAttioImport && (
        <AttioImportModal
          onImport={deals => {
            dispatch({ type: 'IMPORT_DEALS', payload: deals })
            setShowAttioImport(false)
          }}
          onCancel={() => setShowAttioImport(false)}
        />
      )}
    </div>
  )
}

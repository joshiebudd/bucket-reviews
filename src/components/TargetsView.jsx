import { Fragment } from 'react'
import { formatGBP } from '../utils/pipeline'

const DEADLINE = '20 Apr 2026'
const DEADLINE_DATE = new Date('2026-04-20')
const START_DATE = new Date('2026-01-20')

const DEAL_TIERS = [
  { key: 'solo',       label: 'Solo',       dealValue: 1300  },
  { key: 'small',      label: 'Small',      dealValue: 6500  },
  { key: 'medium',     label: 'Medium',     dealValue: 13000 },
  { key: 'large',      label: 'Large',      dealValue: 39000 },
  { key: 'enterprise', label: 'Enterprise', dealValue: 65000 },
]

function Counter({ value, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <button
        onClick={() => onChange(Math.max(0, value - 1))}
        style={{
          width: 26, height: 26, borderRadius: '50%',
          background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
          color: '#f87171', fontSize: 16, fontWeight: 700, lineHeight: 1,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}
      >−</button>
      <input
        type="number"
        min="0"
        value={value}
        onChange={e => onChange(Math.max(0, parseInt(e.target.value) || 0))}
        style={{
          width: 44, textAlign: 'center', fontSize: 16, fontWeight: 700,
          background: 'var(--bg-app)', border: '1px solid var(--border)',
          borderRadius: 8, color: 'var(--text-primary)', padding: '4px 0',
          marginBottom: 0,
        }}
      />
      <button
        onClick={() => onChange(value + 1)}
        style={{
          width: 26, height: 26, borderRadius: '50%',
          background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)',
          color: '#4ade80', fontSize: 16, fontWeight: 700, lineHeight: 1,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0,
        }}
      >+</button>
    </div>
  )
}

function computeStatement(targets) {
  const today = new Date()
  const totalMs = DEADLINE_DATE - START_DATE
  const elapsedMs = Math.min(today - START_DATE, totalMs)
  const progress = Math.max(0, elapsedMs / totalMs)

  const actuals = targets?.actuals || {}
  const goals = targets?.goals || {}

  const kdmActual = actuals.kdmMeetings || 0
  const contractsActual = DEAL_TIERS.reduce((s, t) => s + (actuals[t.key] || 0), 0)
  const valueActual = DEAL_TIERS.reduce((s, t) => s + (actuals[t.key] || 0) * t.dealValue, 0)

  const kdmBase = goals.kdmMeetings?.base || 0
  const kdmStretch = goals.kdmMeetings?.stretch || 0
  const contractBase = goals.annualContracts?.base || 0
  const contractStretch = goals.annualContracts?.stretch || 0
  const valueBase = goals.totalValue?.base || 0
  const valueStretch = goals.totalValue?.stretch || 0

  const daysElapsed = Math.round(progress * 90)
  const daysRemaining = Math.max(0, 90 - daysElapsed)
  const todayStr = today.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  let trajectoryPct = null, trajectoryMetric = null
  if (valueBase > 0 && progress > 0) {
    trajectoryPct = ((valueActual / (valueBase * progress)) - 1) * 100
    trajectoryMetric = 'contract value'
  } else if (contractBase > 0 && progress > 0) {
    trajectoryPct = ((contractsActual / (contractBase * progress)) - 1) * 100
    trajectoryMetric = 'deals closed'
  } else if (kdmBase > 0 && progress > 0) {
    trajectoryPct = ((kdmActual / (kdmBase * progress)) - 1) * 100
    trajectoryMetric = 'KDM meetings'
  }

  return {
    todayStr, daysElapsed, daysRemaining,
    kdmActual, contractsActual, valueActual,
    kdmBase, kdmStretch, contractBase, contractStretch, valueBase, valueStretch,
    hasGoals: kdmBase > 0 || contractBase > 0 || valueBase > 0,
    hasStretch: kdmStretch > 0 || contractStretch > 0 || valueStretch > 0,
    hasActuals: kdmActual > 0 || contractsActual > 0 || valueActual > 0,
    trajectoryPct, trajectoryMetric,
  }
}

function join(parts) {
  if (!parts.length) return ''
  if (parts.length === 1) return parts[0]
  return parts.slice(0, -1).join(', ') + ' and ' + parts[parts.length - 1]
}

export default function TargetsView({ targets, onUpdate }) {
  const t = targets || {}
  const actuals = t.actuals || {}
  const goals = t.goals || {}

  function setActual(key, val) {
    onUpdate({ ...t, actuals: { ...actuals, [key]: val } })
  }
  function setGoal(metric, kind, val) {
    onUpdate({ ...t, goals: { ...goals, [metric]: { ...(goals[metric] || {}), [kind]: val } } })
  }

  const s = computeStatement(targets)

  // Statement parts
  const commitParts = [
    s.kdmBase > 0 && `book ${s.kdmBase} KDM meetings`,
    s.contractBase > 0 && `close ${s.contractBase} contract${s.contractBase !== 1 ? 's' : ''}`,
    s.valueBase > 0 && `generate ${formatGBP(s.valueBase)} in contract value`,
  ].filter(Boolean)

  const stretchParts = [
    s.kdmStretch > 0 && `${s.kdmStretch} KDM meetings`,
    s.contractStretch > 0 && `${s.contractStretch} contracts`,
    s.valueStretch > 0 && `${formatGBP(s.valueStretch)}`,
  ].filter(Boolean)

  const actualParts = [
    s.kdmActual > 0 && `booked ${s.kdmActual} KDM meeting${s.kdmActual !== 1 ? 's' : ''}`,
    s.contractsActual > 0 && `closed ${s.contractsActual} contract${s.contractsActual !== 1 ? 's' : ''}`,
    s.valueActual > 0 && `generated ${formatGBP(s.valueActual)} in value`,
  ].filter(Boolean)

  const em = (text, color) => (
    <span style={{ color: color || 'var(--text-primary)', fontWeight: 700 }}>{text}</span>
  )

  const goalInputStyle = {
    width: '100%', marginBottom: 0, textAlign: 'center', fontWeight: 600,
    background: 'var(--bg-app)', border: '1px solid var(--border)',
    borderRadius: 8, fontSize: 13,
  }

  return (
    <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: 20, flex: 1, overflowY: 'auto', width: '100%' }}>

      {/* ── Input strip ───────────────────────────────── */}
      <div style={{ background: 'var(--bg-raised)', borderRadius: 'var(--radius)', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 16 }}>

        {/* Actuals row */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 10 }}>Actuals</div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(6, 1fr)', gap: 8 }}>
            {/* KDM meetings */}
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '10px 8px', background: 'var(--bg-app)', borderRadius: 10, border: '1px solid var(--border)' }}>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.3 }}>KDM Meetings</span>
              <Counter value={actuals.kdmMeetings || 0} onChange={v => setActual('kdmMeetings', v)} />
            </div>
            {DEAL_TIERS.map(tier => (
              <div key={tier.key} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, padding: '10px 8px', background: 'var(--bg-app)', borderRadius: 10, border: '1px solid var(--border)' }}>
                <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textAlign: 'center', lineHeight: 1.3 }}>{tier.label}<br /><span style={{ color: '#818cf8', fontWeight: 500 }}>{formatGBP(tier.dealValue)}</span></span>
                <Counter value={actuals[tier.key] || 0} onChange={v => setActual(tier.key, v)} />
              </div>
            ))}
          </div>
        </div>

        {/* Goals row */}
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)', marginBottom: 10 }}>
            90-day goals · to {DEADLINE}
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '80px 1fr 1fr 1fr', gap: 8, alignItems: 'center' }}>
            <div />
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', fontWeight: 600 }}>KDM meetings</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', fontWeight: 600 }}>Contracts</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', fontWeight: 600 }}>Total value</div>

            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>Base</div>
            <input type="number" min="0" placeholder="—" value={goals.kdmMeetings?.base || ''} onChange={e => setGoal('kdmMeetings', 'base', Number(e.target.value) || 0)} style={goalInputStyle} />
            <input type="number" min="0" placeholder="—" value={goals.annualContracts?.base || ''} onChange={e => setGoal('annualContracts', 'base', Number(e.target.value) || 0)} style={goalInputStyle} />
            <input type="number" min="0" placeholder="—" value={goals.totalValue?.base || ''} onChange={e => setGoal('totalValue', 'base', Number(e.target.value) || 0)} style={goalInputStyle} />

            <div style={{ fontSize: 12, fontWeight: 600, color: '#818cf8' }}>Stretch</div>
            <input type="number" min="0" placeholder="—" value={goals.kdmMeetings?.stretch || ''} onChange={e => setGoal('kdmMeetings', 'stretch', Number(e.target.value) || 0)} style={{ ...goalInputStyle, borderColor: 'rgba(129,140,248,0.35)' }} />
            <input type="number" min="0" placeholder="—" value={goals.annualContracts?.stretch || ''} onChange={e => setGoal('annualContracts', 'stretch', Number(e.target.value) || 0)} style={{ ...goalInputStyle, borderColor: 'rgba(129,140,248,0.35)' }} />
            <input type="number" min="0" placeholder="—" value={goals.totalValue?.stretch || ''} onChange={e => setGoal('totalValue', 'stretch', Number(e.target.value) || 0)} style={{ ...goalInputStyle, borderColor: 'rgba(129,140,248,0.35)' }} />
          </div>
        </div>
      </div>

      {/* ── Statement ─────────────────────────────────── */}
      <div style={{ background: 'var(--bg-raised)', borderRadius: 'var(--radius)', padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
        <div style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--text-muted)' }}>Where we stand</div>

        <p style={{ fontSize: 16, lineHeight: 1.8, color: 'var(--text-secondary)', margin: 0 }}>
          By {em(DEADLINE)},{' '}
          {commitParts.length > 0
            ? <>we said we'd {em(join(commitParts))}{s.hasStretch ? <>, with a stretch of {em(join(stretchParts), '#818cf8')}</> : ''}</>
            : <>we haven't set any targets yet</>
          }.
        </p>

        <p style={{ fontSize: 16, lineHeight: 1.8, color: 'var(--text-secondary)', margin: 0 }}>
          Today is {em(s.todayStr)} — {em(String(s.daysElapsed))} of 90 days in
          {s.daysRemaining > 0
            ? <>, with {em(`${s.daysRemaining} days`)} remaining</>
            : <>, and {em('the deadline has passed', '#f87171')}</>
          }.
        </p>

        <p style={{ fontSize: 16, lineHeight: 1.8, color: 'var(--text-secondary)', margin: 0 }}>
          {actualParts.length > 0
            ? <>So far we've {em(join(actualParts))}</>
            : <>So far, nothing has been logged yet</>
          }.
        </p>

        {s.trajectoryPct !== null && (
          <p style={{ fontSize: 16, lineHeight: 1.8, color: 'var(--text-secondary)', margin: 0 }}>
            Based on {s.trajectoryMetric}, we are{' '}
            {em(
              `${Math.abs(Math.round(s.trajectoryPct))}% ${s.trajectoryPct >= 0 ? 'ahead of' : 'behind'} trajectory`,
              s.trajectoryPct >= 0 ? '#22c55e' : '#f87171'
            )}.
          </p>
        )}
      </div>

    </div>
  )
}

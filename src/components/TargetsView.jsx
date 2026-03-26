import { Fragment } from 'react'
import { formatGBP } from '../utils/pipeline'

const DEADLINE = '20 Apr 2026'
const DEADLINE_DATE = new Date('2026-04-20')
const START_DATE = new Date('2026-01-20') // 90 days before deadline

function trajectoryStatement(targets) {
  const today = new Date()
  const totalMs = DEADLINE_DATE - START_DATE
  const elapsedMs = Math.min(today - START_DATE, totalMs)
  const progress = Math.max(0, elapsedMs / totalMs) // 0–1

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

  const daysTotal = 90
  const daysElapsed = Math.round(progress * daysTotal)
  const daysRemaining = Math.max(0, daysTotal - daysElapsed)

  const todayStr = today.toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })

  // Build commitment sentence
  const hasBase = kdmBase > 0 || contractBase > 0 || valueBase > 0
  const hasStretch = kdmStretch > 0 || contractStretch > 0 || valueStretch > 0
  const hasAny = hasBase || hasStretch

  // Trajectory: compare actual vs expected-at-this-point for primary metric
  // Use value if set, else contracts, else KDM meetings
  let trajectoryPct = null
  let trajectoryMetric = null
  if (valueBase > 0) {
    const expected = valueBase * progress
    trajectoryPct = expected > 0 ? ((valueActual / expected) - 1) * 100 : null
    trajectoryMetric = 'value'
  } else if (contractBase > 0) {
    const expected = contractBase * progress
    trajectoryPct = expected > 0 ? ((contractsActual / expected) - 1) * 100 : null
    trajectoryMetric = 'contracts'
  } else if (kdmBase > 0) {
    const expected = kdmBase * progress
    trajectoryPct = expected > 0 ? ((kdmActual / expected) - 1) * 100 : null
    trajectoryMetric = 'meetings'
  }

  return {
    todayStr, daysElapsed, daysRemaining, progress,
    kdmActual, contractsActual, valueActual,
    kdmBase, kdmStretch, contractBase, contractStretch, valueBase, valueStretch,
    hasBase, hasStretch, hasAny,
    trajectoryPct, trajectoryMetric,
  }
}

const DEAL_TIERS = [
  { key: 'solo',       label: 'Solo',       dealValue: 1300  },
  { key: 'small',      label: 'Small',      dealValue: 6500  },
  { key: 'medium',     label: 'Medium',     dealValue: 13000 },
  { key: 'large',      label: 'Large',      dealValue: 39000 },
  { key: 'enterprise', label: 'Enterprise', dealValue: 65000 },
]

function Counter({ value, onChange }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <button
        onClick={() => onChange(Math.max(0, value - 1))}
        style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'rgba(239,68,68,0.15)', border: '1px solid rgba(239,68,68,0.3)',
          color: '#f87171', fontSize: 18, fontWeight: 700, lineHeight: 1,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, transition: 'background 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(239,68,68,0.28)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(239,68,68,0.15)'}
      >−</button>
      <input
        type="number"
        min="0"
        value={value}
        onChange={e => onChange(Math.max(0, parseInt(e.target.value) || 0))}
        style={{
          width: 64, textAlign: 'center', fontSize: 18, fontWeight: 700,
          background: 'var(--bg-raised)', border: '1px solid var(--border)',
          borderRadius: 10, color: 'var(--text-primary)', padding: '6px 0',
          marginBottom: 0, outline: 'none',
        }}
      />
      <button
        onClick={() => onChange(value + 1)}
        style={{
          width: 32, height: 32, borderRadius: '50%',
          background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)',
          color: '#4ade80', fontSize: 18, fontWeight: 700, lineHeight: 1,
          cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
          flexShrink: 0, transition: 'background 0.15s',
        }}
        onMouseEnter={e => e.currentTarget.style.background = 'rgba(34,197,94,0.28)'}
        onMouseLeave={e => e.currentTarget.style.background = 'rgba(34,197,94,0.15)'}
      >+</button>
    </div>
  )
}

function GoalInput({ value, onChange, prefix }) {
  return (
    <div style={{ position: 'relative' }}>
      {prefix && (
        <span style={{
          position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)',
          fontSize: 13, color: 'var(--text-muted)', pointerEvents: 'none',
        }}>{prefix}</span>
      )}
      <input
        type="number"
        min="0"
        value={value || ''}
        onChange={e => onChange(Number(e.target.value) || 0)}
        placeholder="—"
        style={{
          width: '100%', marginBottom: 0, textAlign: 'right',
          paddingLeft: prefix ? 20 : undefined,
          background: 'var(--bg-raised)', border: '1px solid var(--border)',
          borderRadius: 10, fontSize: 14, fontWeight: 600,
          color: 'var(--text-primary)',
        }}
      />
    </div>
  )
}

function Statement({ targets }) {
  const s = trajectoryStatement(targets)

  const buildCommitment = () => {
    const parts = []
    if (s.kdmBase > 0)       parts.push(`book ${s.kdmBase} KDM meetings`)
    if (s.contractBase > 0)  parts.push(`close ${s.contractBase} contract${s.contractBase !== 1 ? 's' : ''}`)
    if (s.valueBase > 0)     parts.push(`generate ${formatGBP(s.valueBase)} in contract value`)
    return parts
  }

  const buildStretch = () => {
    const parts = []
    if (s.kdmStretch > 0)       parts.push(`${s.kdmStretch} KDM meetings`)
    if (s.contractStretch > 0)  parts.push(`${s.contractStretch} contract${s.contractStretch !== 1 ? 's' : ''}`)
    if (s.valueStretch > 0)     parts.push(`${formatGBP(s.valueStretch)} value`)
    return parts
  }

  const buildActuals = () => {
    const parts = []
    if (s.kdmActual > 0)       parts.push(`booked ${s.kdmActual} KDM meeting${s.kdmActual !== 1 ? 's' : ''}`)
    if (s.contractsActual > 0) parts.push(`closed ${s.contractsActual} contract${s.contractsActual !== 1 ? 's' : ''}`)
    if (s.valueActual > 0)     parts.push(`generated ${formatGBP(s.valueActual)} in value`)
    return parts
  }

  const commitment = buildCommitment()
  const stretch = buildStretch()
  const actuals = buildActuals()

  function joinParts(parts) {
    if (parts.length === 0) return null
    if (parts.length === 1) return parts[0]
    return parts.slice(0, -1).join(', ') + ' and ' + parts[parts.length - 1]
  }

  const trajectoryColor = s.trajectoryPct === null ? 'var(--text-muted)'
    : s.trajectoryPct >= 0 ? '#22c55e' : '#f87171'

  const trajectoryText = s.trajectoryPct === null ? null
    : s.trajectoryPct >= 0
      ? `${Math.abs(Math.round(s.trajectoryPct))}% ahead of trajectory`
      : `${Math.abs(Math.round(s.trajectoryPct))}% behind trajectory`

  const pStyle = { fontSize: 15, lineHeight: 1.7, color: 'var(--text-secondary)', margin: 0 }
  const strong = { color: 'var(--text-primary)', fontWeight: 600 }

  return (
    <div style={{ background: 'var(--bg-raised)', borderRadius: 'var(--radius)', padding: 24 }}>
      <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 16 }}>
        Where we stand
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {/* Commitment */}
        <p style={pStyle}>
          By <span style={strong}>{DEADLINE}</span>
          {commitment.length > 0
            ? <>, we committed to <span style={strong}>{joinParts(commitment)}</span>
              {stretch.length > 0 && <>, with a stretch of <span style={{ color: '#818cf8', fontWeight: 600 }}>{joinParts(stretch)}</span></>}.
            </>
            : <>, we haven't set any targets yet. Use the goals section below to define your base and stretch.</>
          }
        </p>

        {/* Today + days */}
        <p style={pStyle}>
          Today is <span style={strong}>{s.todayStr}</span> — {s.daysElapsed} of 90 days in
          {s.daysRemaining > 0
            ? <>, with <span style={strong}>{s.daysRemaining} days remaining</span>.</>
            : <> — <span style={{ color: '#f87171', fontWeight: 600 }}>the deadline has passed.</span></>
          }
        </p>

        {/* Actuals */}
        <p style={pStyle}>
          {actuals.length > 0
            ? <>So far we've <span style={strong}>{joinParts(actuals)}</span>.</>
            : <>So far, nothing has been logged yet. Use the counters above to record your progress.</>
          }
        </p>

        {/* Trajectory */}
        {trajectoryText && (
          <p style={pStyle}>
            Based on {s.trajectoryMetric === 'value' ? 'contract value' : s.trajectoryMetric === 'contracts' ? 'deals closed' : 'KDM meetings'}, we are{' '}
            <span style={{ color: trajectoryColor, fontWeight: 700 }}>{trajectoryText}</span>.
          </p>
        )}
      </div>
    </div>
  )
}

export default function TargetsView({ targets, onUpdate }) {
  const t = targets || {}
  const actuals = t.actuals || {}
  const goals = t.goals || {}

  function setActual(key, val) {
    onUpdate({
      ...t,
      actuals: { ...actuals, [key]: val },
    })
  }

  function setGoal(metric, kind, val) {
    onUpdate({
      ...t,
      goals: {
        ...goals,
        [metric]: { ...(goals[metric] || {}), [kind]: val },
      },
    })
  }

  const kdmCount = actuals.kdmMeetings || 0
  const totalDealsValue = DEAL_TIERS.reduce((sum, tier) => sum + (actuals[tier.key] || 0) * tier.dealValue, 0)
  const totalDeals = DEAL_TIERS.reduce((sum, tier) => sum + (actuals[tier.key] || 0), 0)

  const goalRows = [
    { key: 'kdmMeetings',     label: 'KDM meetings',     prefix: null  },
    { key: 'annualContracts', label: 'Annual contracts',  prefix: null  },
    { key: 'totalValue',      label: 'Total value',       prefix: '£'   },
  ]

  return (
    <div style={{ padding: '24px', maxWidth: 720, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Actuals */}
      <div style={{ background: 'var(--bg-raised)', borderRadius: 'var(--radius)', padding: 20 }}>
        <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)', marginBottom: 18 }}>
          Actuals
        </div>

        {/* KDM Meetings */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingBottom: 16, marginBottom: 16, borderBottom: '1px solid var(--border)' }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>Meetings booked with KDMs</div>
            <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Total meetings secured</div>
          </div>
          <Counter value={kdmCount} onChange={v => setActual('kdmMeetings', v)} />
        </div>

        {/* Deal tiers */}
        <div style={{ fontSize: 12, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)', marginBottom: 12 }}>
          Deals closed
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {DEAL_TIERS.map(tier => {
            const count = actuals[tier.key] || 0
            const tierTotal = count * tier.dealValue
            return (
              <div key={tier.key} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{tier.label}</span>
                  <span style={{ fontSize: 12, color: 'var(--text-muted)', marginLeft: 8 }}>{formatGBP(tier.dealValue)}/deal</span>
                </div>
                <Counter value={count} onChange={v => setActual(tier.key, v)} />
                <div style={{ width: 80, textAlign: 'right', fontSize: 13, fontWeight: 600, color: tierTotal > 0 ? '#22c55e' : 'var(--text-muted)' }}>
                  {tierTotal > 0 ? formatGBP(tierTotal) : '—'}
                </div>
              </div>
            )
          })}
        </div>

        {/* Total */}
        <div style={{ marginTop: 16, paddingTop: 16, borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>{totalDeals} deal{totalDeals !== 1 ? 's' : ''} closed</span>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>Total value</div>
            <div style={{ fontSize: 22, fontWeight: 700, color: '#22c55e' }}>{formatGBP(totalDealsValue)}</div>
          </div>
        </div>
      </div>

      {/* Statement */}
      <Statement targets={targets} />

      {/* Goals */}
      <div style={{ background: 'var(--bg-raised)', borderRadius: 'var(--radius)', padding: 20 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 18 }}>
          <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--text-muted)' }}>
            90-day goals
          </div>
          <span style={{ fontSize: 11, color: '#818cf8', background: 'rgba(99,102,241,0.1)', border: '1px solid rgba(99,102,241,0.2)', borderRadius: 10, padding: '2px 10px' }}>
            to {DEADLINE}
          </span>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 120px 120px', gap: '8px 12px', alignItems: 'center' }}>
          <div />
          <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-muted)', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Base</div>
          <div style={{ fontSize: 11, fontWeight: 600, color: '#818cf8', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Stretch</div>

          {goalRows.map(row => (
            <Fragment key={row.key}>
              <div style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{row.label}</div>
              <GoalInput
                value={goals[row.key]?.base}
                onChange={v => setGoal(row.key, 'base', v)}
                prefix={row.prefix}
              />
              <GoalInput
                value={goals[row.key]?.stretch}
                onChange={v => setGoal(row.key, 'stretch', v)}
                prefix={row.prefix}
              />
            </Fragment>
          ))}
        </div>
      </div>

    </div>
  )
}

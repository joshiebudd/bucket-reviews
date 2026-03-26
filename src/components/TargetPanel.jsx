import { formatGBP } from '../utils/pipeline'

const DEADLINE = new Date('2026-04-20')

function daysRemaining() {
  const diff = DEADLINE - new Date()
  return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
}

function Metric({ label, actual, base, stretch, format }) {
  const hasBase = base > 0
  const hasStretch = stretch > 0
  const baseHit = hasBase && actual >= base
  const stretchHit = hasStretch && actual >= stretch

  const actualColor = stretchHit ? '#22c55e' : baseHit ? '#60a5fa' : 'var(--text-primary)'

  return (
    <div style={{
      flex: 1,
      padding: '12px 16px',
      background: 'var(--bg-raised)',
      borderRadius: 'var(--radius)',
      display: 'flex',
      flexDirection: 'column',
      gap: 6,
    }}>
      <div style={{ fontSize: 11, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-muted)' }}>
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 700, color: actualColor }}>
        {format(actual)}
      </div>
      <div style={{ display: 'flex', gap: 10, marginTop: 2 }}>
        {hasBase && (
          <span style={{ fontSize: 11, color: baseHit ? '#60a5fa' : 'var(--text-muted)' }}>
            Base {format(base)}
            {baseHit && ' ✓'}
          </span>
        )}
        {hasStretch && (
          <span style={{ fontSize: 11, color: stretchHit ? '#22c55e' : 'var(--text-muted)' }}>
            Stretch {format(stretch)}
            {stretchHit && ' ✓'}
          </span>
        )}
        {!hasBase && !hasStretch && (
          <span style={{ fontSize: 11, color: 'var(--text-muted)', fontStyle: 'italic' }}>No target set</span>
        )}
      </div>
    </div>
  )
}

export default function TargetPanel({ targets, deals }) {
  const days = daysRemaining()

  const kdmActual = deals.filter(d => d.stage >= 2).length
  const contractsActual = deals.filter(d => d.stage === 6).length
  const valueActual = deals.filter(d => d.stage === 6).reduce((s, d) => s + d.contractValue, 0)

  const t = targets || {}
  const km = t.kdmMeetings     || { base: 0, stretch: 0 }
  const ac = t.annualContracts || { base: 0, stretch: 0 }
  const tv = t.totalValue      || { base: 0, stretch: 0 }

  return (
    <div style={{ padding: '0 24px 20px', display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          90-day targets · to 20 Apr 2026
        </span>
        <span style={{
          fontSize: 11,
          background: days <= 14 ? 'rgba(239,68,68,0.1)' : 'rgba(99,102,241,0.1)',
          color: days <= 14 ? '#f87171' : '#818cf8',
          border: `1px solid ${days <= 14 ? 'rgba(239,68,68,0.3)' : 'rgba(99,102,241,0.2)'}`,
          borderRadius: 10,
          padding: '2px 8px',
        }}>
          {days}d remaining
        </span>
      </div>
      <div style={{ display: 'flex', gap: 10 }}>
        <Metric
          label="Meetings with KDM"
          actual={kdmActual}
          base={km.base}
          stretch={km.stretch}
          format={n => n}
        />
        <Metric
          label="Annual contracts"
          actual={contractsActual}
          base={ac.base}
          stretch={ac.stretch}
          format={n => n}
        />
        <Metric
          label="Total contract value"
          actual={valueActual}
          base={tv.base}
          stretch={tv.stretch}
          format={formatGBP}
        />
      </div>
    </div>
  )
}

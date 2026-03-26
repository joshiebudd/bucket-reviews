export const TARGET_VALUE = 150000

export const STAGES = [
  { id: 1, label: 'Active Conversation' },
  { id: 2, label: 'Deep Dive' },
  { id: 3, label: 'Demo & Proposal' },
  { id: 4, label: 'Negotiating' },
  { id: 5, label: 'Pilot' },
  { id: 6, label: 'Annual Contract' },
]

export const STAGE_COLORS = {
  1: '#94a3b8',
  2: '#818cf8',
  3: '#60a5fa',
  4: '#f59e0b',
  5: '#f97316',
  6: '#22c55e',
}

export const DROP_REASONS = [
  { value: 'ghosted', label: 'Ghosted' },
  { value: 'lost_interest', label: 'Lost Interest' },
  { value: 'not_ready', label: 'Not Ready' },
  { value: 'wrong_fit', label: 'Wrong Fit' },
]

export function computeExpectedValue(deal) {
  return (deal.contractValue * deal.confidence) / 100
}

export function computeTotalWeighted(deals) {
  return deals.reduce((sum, d) => sum + computeExpectedValue(d), 0)
}

export function formatGBP(value) {
  if (value >= 1000) {
    return `£${(value / 1000).toFixed(1)}k`
  }
  return `£${Math.round(value).toLocaleString('en-GB')}`
}

export function formatGBPFull(value) {
  return `£${Math.round(value).toLocaleString('en-GB')}`
}

export function formatDate(isoString) {
  return new Date(isoString).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function computeMovement(currentDeals, sessionDeals) {
  const currentMap = new Map(currentDeals.map(d => [d.id, d]))
  const sessionMap = new Map(sessionDeals.map(d => [d.id, d]))

  const newDeals = currentDeals.filter(d => !sessionMap.has(d.id))
  const movedForward = []
  const movedBack = []
  const unchanged = []
  const missing = sessionDeals.filter(d => !currentMap.has(d.id))

  for (const sessionDeal of sessionDeals) {
    const current = currentMap.get(sessionDeal.id)
    if (!current) continue
    if (current.stage > sessionDeal.stage) movedForward.push({ current, previous: sessionDeal })
    else if (current.stage < sessionDeal.stage) movedBack.push({ current, previous: sessionDeal })
    else unchanged.push(current)
  }

  return { newDeals, movedForward, movedBack, unchanged, missing }
}

export function generateId() {
  return Math.random().toString(36).slice(2, 9) + Date.now().toString(36)
}

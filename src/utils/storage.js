const STORAGE_KEY = 'pipeline-tracker-v1'

export function getDefaultState() {
  return {
    deals: [],
    droppedDeals: [],
    sessions: [],
    compareSessionId: null,
  }
}

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return getDefaultState()
    return JSON.parse(raw)
  } catch {
    return getDefaultState()
  }
}

export function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch (e) {
    console.error('Failed to persist state', e)
  }
}

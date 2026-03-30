const ATTIO_BASE = 'https://api.attio.com/v2'
const API_KEY_STORAGE = 'attio_api_key'

export function getStoredApiKey() {
  return localStorage.getItem(API_KEY_STORAGE) || ''
}

export function saveApiKey(key) {
  localStorage.setItem(API_KEY_STORAGE, key)
}

// Attio stage names → our stage IDs. Lowercase for matching.
const STAGE_MAP = {
  'active conversation (two-way)': 1,
  'active conversation': 1,
  'deep-dive (with kdm)': 2,
  'deep dive (with kdm)': 2,
  'kdm deep-dive': 2,
  'kdm deep dive': 2,
  'deep-dive': 2,
  'deep dive': 2,
  'demo & proposal': 3,
  'demo and proposal': 3,
  'negotiating': 4,
  'pilot': 5,
  'annual contract': 6,
}

const SKIP_STAGES = new Set(['prospecting', 'qualifying'])

async function attioFetch(path, apiKey, options = {}) {
  const res = await fetch(`${ATTIO_BASE}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  })
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`Attio API ${res.status}: ${text}`)
  }
  return res.json()
}

// Fetch all available objects (records-based pipelines)
export async function fetchAttioPipelineLists(apiKey) {
  const objectsData = await attioFetch('/objects', apiKey)
  console.info('[Attio] /objects response:', objectsData)

  const objects = (objectsData.data || []).map(o => ({
    id: o.api_slug || o.id?.object_id || o.id,
    name: o.plural_noun || o.singular_noun || o.api_slug,
    type: 'object',
  }))

  if (objects.length > 0) return objects

  throw new Error(
    'No objects found. Check your API key has read access to records.'
  )
}

function extractName(record) {
  const v = record.values || {}
  const nameVal = v.name?.[0]
  if (nameVal?.value) return String(nameVal.value)
  return 'Unnamed Deal'
}

function extractStage(record) {
  const v = record.values || {}
  const stageVal = v.stage?.[0]
  if (!stageVal) return null
  return stageVal.status?.title || null
}

function extractValue(record) {
  const v = record.values || {}
  for (const slug of ['value', 'deal_value', 'amount', 'contract_value', 'arr', 'revenue']) {
    const attr = v[slug]?.[0]
    if (!attr) continue
    const amount =
      (typeof attr.currency_value === 'number' ? attr.currency_value : attr.currency_value?.amount) ??
      attr.number_value ??
      (typeof attr.value === 'number' ? attr.value : undefined)
    if (typeof amount === 'number') return amount
  }
  return 0
}

const STAGE_DEFAULT_CONFIDENCE = {
  1: 10,  // Active Conversation
  2: 20,  // Deep Dive
  3: 40,  // Demo & Proposal
  4: 70,  // Negotiating
  5: 90,  // Pilot
  6: 100, // Annual Contract
}

export async function importFromAttio(apiKey, listIdOrSlug, type = 'list') {
  let records = []

  if (type === 'object') {
    // Query object records directly
    const data = await attioFetch(`/objects/${listIdOrSlug}/records/query`, apiKey, {
      method: 'POST',
      body: JSON.stringify({ limit: 500 }),
    })
    console.info('[Attio] records/query response (first item):', data.data?.[0])
    records = data.data || []
  } else {
    // Query list entries
    const data = await attioFetch(`/lists/${listIdOrSlug}/entries/query`, apiKey, {
      method: 'POST',
      body: JSON.stringify({ limit: 500 }),
    })
    console.info('[Attio] entries/query response (first item):', data.data?.[0])
    // List entries have the record nested; flatten for uniform processing
    records = (data.data || []).map(entry => ({
      ...entry,
      values: {
        ...(entry.record?.values || {}),
        ...(entry.values || {}),
      },
    }))
  }

  const deals = []
  const skipped = []
  for (const record of records) {
    const stageName = extractStage(record)
    if (!stageName) { skipped.push({ reason: 'no stage', record }); continue }

    const stageLower = stageName.toLowerCase()
    if (SKIP_STAGES.has(stageLower)) continue

    const stageId = STAGE_MAP[stageLower]
    if (!stageId) { skipped.push({ reason: `unknown stage: "${stageName}"`, record }); continue }

    deals.push({
      name: extractName(record),
      stage: stageId,
      contractValue: extractValue(record),
      confidence: STAGE_DEFAULT_CONFIDENCE[stageId] ?? 50,
      notes: '',
    })
  }

  console.info(`[Attio] Imported: ${deals.length}, Skipped: ${skipped.length}`, skipped)
  return deals
}

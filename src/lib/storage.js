// Local-first persistence. Every change is written to localStorage at once.
// If a GitHub token is set, changes are also pushed to a private Gist
// (file: fit-tracker-data.json) and the newer copy wins on load.

const LS_KEY = 'fit-tracker:data'
const LS_SETTINGS = 'fit-tracker:settings'
const GIST_FILE = 'fit-tracker-data.json'

export const emptyState = () => ({
  version: 1,
  updatedAt: 0,
  profile: null,
  cycle: { startDate: null, startIndex: 0, skipped: [] },
  workouts: {},
  daily: {},
  measurements: {},
  prefs: { defaultAlts: {} },
  hair: null,
})

export function loadLocal() {
  try {
    const raw = localStorage.getItem(LS_KEY)
    return raw ? { ...emptyState(), ...JSON.parse(raw) } : emptyState()
  } catch { return emptyState() }
}
export function saveLocal(state) {
  localStorage.setItem(LS_KEY, JSON.stringify(state))
}

export function loadSettings() {
  try { return JSON.parse(localStorage.getItem(LS_SETTINGS) || '{}') } catch { return {} }
}
export function saveSettings(s) { localStorage.setItem(LS_SETTINGS, JSON.stringify(s)) }

const api = (path, opts = {}, token) =>
  fetch('https://api.github.com' + path, {
    ...opts,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: 'Bearer ' + token,
      'Content-Type': 'application/json',
      ...(opts.headers || {}),
    },
  })

export async function findOrCreateGist(token) {
  const res = await api('/gists?per_page=100', {}, token)
  if (!res.ok) throw new Error('GitHub rejected the token (' + res.status + ')')
  const gists = await res.json()
  const found = gists.find((g) => g.files && g.files[GIST_FILE])
  if (found) return found.id
  const create = await api('/gists', {
    method: 'POST',
    body: JSON.stringify({ description: 'Fit Tracker data', public: false, files: { [GIST_FILE]: { content: JSON.stringify(emptyState()) } } }),
  }, token)
  if (!create.ok) throw new Error('Could not create the Gist (' + create.status + ')')
  return (await create.json()).id
}

export async function pullGist(token, gistId) {
  const res = await api('/gists/' + gistId, {}, token)
  if (!res.ok) throw new Error('Could not read the Gist (' + res.status + ')')
  const g = await res.json()
  const f = g.files[GIST_FILE]
  if (!f) return null
  let content = f.content
  if (f.truncated) content = await (await fetch(f.raw_url)).text()
  try { return { ...emptyState(), ...JSON.parse(content) } } catch { return null }
}

export async function pushGist(token, gistId, state) {
  const res = await api('/gists/' + gistId, {
    method: 'PATCH',
    body: JSON.stringify({ files: { [GIST_FILE]: { content: JSON.stringify(state) } } }),
  }, token)
  if (!res.ok) throw new Error('Could not save to the Gist (' + res.status + ')')
}

export function exportJson(state) {
  const blob = new Blob([JSON.stringify(state, null, 2)], { type: 'application/json' })
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = `fit-tracker-backup-${new Date().toISOString().slice(0, 10)}.json`
  a.click()
  URL.revokeObjectURL(a.href)
}

// Merge two copies entry by entry so a stale device can never wipe entries
// made on another one. Collections are keyed by date: a key present in only
// one copy is kept; a key present in both takes the one from the copy with
// the newer updatedAt. Singletons (profile, cycle, prefs, hair settings) come
// from the newer copy.
const COLLECTIONS = ['workouts', 'daily', 'measurements']
export function mergeStates(a, b) {
  if (!a) return b
  if (!b) return a
  const [newer, older] = a.updatedAt >= b.updatedAt ? [a, b] : [b, a]
  const out = { ...older, ...newer }
  COLLECTIONS.forEach((c) => { out[c] = { ...(older[c] || {}), ...(newer[c] || {}) } })
  if (older.hair || newer.hair) {
    out.hair = { ...(older.hair || {}), ...(newer.hair || {}) }
    out.hair.log = { ...(older.hair?.log || {}), ...(newer.hair?.log || {}) }
    out.hair.checkins = { ...(older.hair?.checkins || {}), ...(newer.hair?.checkins || {}) }
  }
  out.prefs = { ...(older.prefs || {}), ...(newer.prefs || {}) }
  out.prefs.defaultAlts = { ...(older.prefs?.defaultAlts || {}), ...(newer.prefs?.defaultAlts || {}) }
  out.updatedAt = Math.max(a.updatedAt || 0, b.updatedAt || 0)
  return out
}

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { loadLocal, saveLocal, loadSettings, saveSettings, pullGist, pushGist, findOrCreateGist, mergeStates } from './lib/storage'
import { buildSchedule, computeTargets, weeklyAverages } from './lib/calc'
import Today from './tabs/Today'
import Nutrition from './tabs/Nutrition'
import Calendar from './tabs/Calendar'
import Plan from './tabs/Plan'
import Hair from './tabs/Hair'

const TABS = [
  { key: 'today', label: 'Workout' },
  { key: 'nutrition', label: 'Nutrition' },
  { key: 'calendar', label: 'Streak' },
  { key: 'hair', label: 'Hair' },
  { key: 'plan', label: 'Plan' },
]

export default function App() {
  const [state, setState] = useState(loadLocal)
  const [settings, setSettingsState] = useState(loadSettings)
  const [tab, setTab] = useState('today')
  const [sync, setSync] = useState({ status: 'idle', msg: '' })
  const [toast, setToast] = useState(null)
  const pushTimer = useRef(null)
  const stateRef = useRef(state)
  stateRef.current = state
  const settingsRef = useRef(settings)
  settingsRef.current = settings
  const lastPushedAt = useRef(0)
  const skipNextPush = useRef(true)

  const showToast = useCallback((msg, err = false) => {
    setToast({ msg, err }); setTimeout(() => setToast(null), 2600)
  }, [])

  // Every change bumps updatedAt and persists locally at once.
  const update = useCallback((fn) => {
    setState((prev) => {
      const next = typeof fn === 'function' ? fn(prev) : { ...prev, ...fn }
      next.updatedAt = Date.now()
      saveLocal(next)
      return next
    })
  }, [])

  const setSettings = useCallback((s) => { setSettingsState(s); saveSettings(s) }, [])

  // Pull from the Gist when a token is present; the newer copy wins.
  useEffect(() => {
    if (!settings.token) { setSync({ status: 'off', msg: '' }); return }
    let cancelled = false
    ;(async () => {
      try {
        setSync({ status: 'busy', msg: 'Syncing' })
        let gistId = settings.gistId
        if (!gistId) { gistId = await findOrCreateGist(settings.token); setSettings({ ...settings, gistId }) }
        const remote = await pullGist(settings.token, gistId)
        if (cancelled) return
        if (remote) {
          const merged = mergeStates(stateRef.current, remote)
          const changedLocal = JSON.stringify(merged) !== JSON.stringify(stateRef.current)
          const changedRemote = JSON.stringify(merged) !== JSON.stringify(remote)
          if (changedLocal) { skipNextPush.current = true; setState(merged); saveLocal(merged); showToast('Merged data from cloud') }
          if (changedRemote) await pushGist(settings.token, gistId, merged)
        }
        setSync({ status: 'ok', msg: 'Synced' })
      } catch (e) {
        setSync({ status: 'err', msg: e.message })
      }
    })()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.token])

  // Push after local changes: debounced for typing, immediate for saves.
  const doPush = useCallback(async (keepalive = false) => {
    if (!settingsRef.current.token || !settingsRef.current.gistId) return
    try {
      setSync({ status: 'busy', msg: 'Saving' })
      if (keepalive) {
        // Page is being hidden: one best-effort request, no pre-pull.
        await pushGist(settingsRef.current.token, settingsRef.current.gistId, stateRef.current, true)
      } else {
        const remote = await pullGist(settingsRef.current.token, settingsRef.current.gistId)
        const merged = mergeStates(stateRef.current, remote)
        if (JSON.stringify(merged) !== JSON.stringify(stateRef.current)) { skipNextPush.current = true; setState(merged); saveLocal(merged) }
        await pushGist(settingsRef.current.token, settingsRef.current.gistId, merged)
      }
      lastPushedAt.current = stateRef.current.updatedAt
      setSync({ status: 'ok', msg: 'Synced' })
    } catch (e) { setSync({ status: 'err', msg: e.message }) }
  }, [])

  useEffect(() => {
    if (skipNextPush.current) { skipNextPush.current = false; return }
    if (!settings.token || !settings.gistId) return
    clearTimeout(pushTimer.current)
    pushTimer.current = setTimeout(() => doPush(), 1500)
    return () => clearTimeout(pushTimer.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.updatedAt])

  // Flush pending changes the moment the app is backgrounded or closed.
  useEffect(() => {
    const flush = () => {
      if (document.visibilityState !== 'hidden') return
      if (lastPushedAt.current >= stateRef.current.updatedAt) return
      clearTimeout(pushTimer.current)
      doPush(true)
    }
    document.addEventListener('visibilitychange', flush)
    window.addEventListener('pagehide', flush)
    return () => { document.removeEventListener('visibilitychange', flush); window.removeEventListener('pagehide', flush) }
  }, [doPush])

  // Targets follow the most recent weekly average weight and the latest
  // measured body fat, so they adjust as you progress.
  const targets = useMemo(() => {
    if (!state.profile) return null
    const weeks = weeklyAverages(state.daily).filter((w) => w.weight != null)
    const latestWeight = weeks.length ? weeks[weeks.length - 1].weight : state.profile.weightKg
    const ms = Object.keys(state.measurements || {}).sort()
    const latestBf = ms.length ? state.measurements[ms[ms.length - 1]].bodyfat : null
    return computeTargets({ ...state.profile, weightKg: latestWeight || state.profile.weightKg, bodyFat: latestBf ?? state.profile.bodyFat })
  }, [state.profile, state.daily, state.measurements])
  const schedule = useMemo(() => buildSchedule(state), [state])

  const ctx = { state, update, targets, schedule, settings, setSettings, showToast, setTab, sync, flushNow: () => { clearTimeout(pushTimer.current); doPush() } }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand"><span className="dot" />FIT TRACKER</div>
        <div className={'sync ' + sync.status} title={sync.msg}>
          <span className="led" />
          {sync.status === 'off' ? 'Local only' : sync.status === 'busy' ? sync.msg : sync.status === 'err' ? 'Sync error' : 'Synced'}
        </div>
      </header>

      {tab === 'today' && <Today {...ctx} />}
      {tab === 'nutrition' && <Nutrition {...ctx} />}
      {tab === 'calendar' && <Calendar {...ctx} />}
      {tab === 'hair' && <Hair {...ctx} />}
      {tab === 'plan' && <Plan {...ctx} />}

      <nav className="tabs">
        <div className="tabs-inner">
          {TABS.map((t) => (
            <button key={t.key} className={'tab' + (tab === t.key ? ' active' : '')} onClick={() => setTab(t.key)}>{t.label}</button>
          ))}
        </div>
      </nav>
      {toast && <div className={'toast' + (toast.err ? ' err' : '')}>{toast.msg}</div>}
    </div>
  )
}

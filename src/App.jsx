import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { loadLocal, saveLocal, loadSettings, saveSettings, pullGist, pushGist, findOrCreateGist } from './lib/storage'
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
        if (remote && remote.updatedAt > stateRef.current.updatedAt) {
          skipNextPush.current = true
          setState(remote); saveLocal(remote); showToast('Loaded newer data from cloud')
        } else if (remote && remote.updatedAt < stateRef.current.updatedAt) {
          await pushGist(settings.token, gistId, stateRef.current)
        }
        setSync({ status: 'ok', msg: 'Synced' })
      } catch (e) {
        setSync({ status: 'err', msg: e.message })
      }
    })()
    return () => { cancelled = true }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.token])

  // Debounced push after local changes.
  useEffect(() => {
    if (skipNextPush.current) { skipNextPush.current = false; return }
    if (!settings.token || !settings.gistId) return
    clearTimeout(pushTimer.current)
    pushTimer.current = setTimeout(async () => {
      try {
        setSync({ status: 'busy', msg: 'Saving' })
        await pushGist(settings.token, settings.gistId, stateRef.current)
        setSync({ status: 'ok', msg: 'Synced' })
      } catch (e) { setSync({ status: 'err', msg: e.message }) }
    }, 1500)
    return () => clearTimeout(pushTimer.current)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.updatedAt])

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

  const ctx = { state, update, targets, schedule, settings, setSettings, showToast, setTab, sync }

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

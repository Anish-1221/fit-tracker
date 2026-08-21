import { useRef, useState } from 'react'
import { DAYS, EXERCISES, CYCLE, FOCUS_LOOKUP, yt, restLabel } from '../data/program'
import { exportJson, findOrCreateGist, pullGist, saveLocal } from '../lib/storage'
import { fmtDate, dayLabel } from '../lib/calc'

export default function Plan({ state, update, settings, setSettings, showToast, sync }) {
  return (
    <>
      <ProgramCard state={state} />
      <SyncCard settings={settings} setSettings={setSettings} showToast={showToast} sync={sync} state={state} update={update} />
      <DataCard state={state} update={update} showToast={showToast} />
    </>
  )
}

function ProgramCard({ state }) {
  const [open, setOpen] = useState('upper1')
  return (
    <section className="card">
      <div className="eyebrow">The program</div>
      <h2 style={{ margin: '6px 0 8px' }}>Seven-day cycle</h2>
      <p className="muted small">Dr. Swole's low-volume upper/lower split, run with dumbbells and machines, plus one short abs and cardio day. Each muscle is trained twice per cycle with 48 to 72 hours between sessions, which is the spacing the frequency research supports (Schoenfeld 2016, Grgic 2018), and two full rest days.</p>
      <div className="btn-row" style={{ marginTop: 14 }}>
        {CYCLE.map((c, i) => <span key={i} className={'chip ' + (c === 'rest' ? '' : c === 'abs' ? 'teal' : 'accent')}>{i + 1}. {DAYS[c].label}</span>)}
      </div>
      <div className="divider" />
      <div className="seg" style={{ flexWrap: 'wrap', marginBottom: 10 }}>
        {Object.values(DAYS).filter((d) => d.kind !== 'rest').map((d) => <button key={d.key} className={open === d.key ? 'active' : ''} onClick={() => setOpen(d.key)}>{d.label}</button>)}
      </div>
      <table>
        <thead><tr><th>Exercise</th><th>Muscles</th><th className="num">Sets x reps</th><th className="num">Rest</th></tr></thead>
        <tbody>
          {DAYS[open].exercises.map((id) => {
            const ex = EXERCISES[id]
            const chosen = state.prefs?.defaultAlts?.[id]
            const alt = chosen ? ex.alternatives.find((a) => a.id === chosen) : null
            return (
              <tr key={id}>
                <td><a href={yt(alt?.name || ex.name)} target="_blank" rel="noreferrer">{alt?.name || ex.name}</a>{alt && alt.id !== id && <div className="tiny faint">swapped from {ex.name}</div>}<div className="tiny faint">{ex.alternatives.length} options</div></td>
                <td className="small muted">{alt?.muscles || ex.muscles}</td>
                <td className="num">{ex.sets} x {ex.reps}</td>
                <td className="num">{restLabel(ex.rest)}</td>
              </tr>
            )
          })}
          {Object.values(state.prefs?.focus || {}).flatMap((f) => f.exercises).filter((id) => FOCUS_LOOKUP[id]?.day === open).map((id) => {
            const ex = FOCUS_LOOKUP[id]
            return <tr key={id}><td><a href={yt(ex.name)} target="_blank" rel="noreferrer">{ex.name}</a><div className="tiny teal">focus block</div></td><td className="small muted">{ex.muscles}</td><td className="num">{ex.sets} x {ex.reps}</td><td className="num">{restLabel(ex.rest)}</td></tr>
          })}
        </tbody>
      </table>
      <details style={{ marginTop: 14 }}>
        <summary className="small accent">Rest time and recovery, what the research says</summary>
        <div className="note" style={{ marginTop: 10, lineHeight: 1.6 }}>
          <b>Between sets.</b> Schoenfeld et al. (2016) compared 1 versus 3 minute rests over 8 weeks with everything else equal: the 3 minute group gained more strength and more muscle, because they kept more reps and load across sets. A 2024 meta-analysis confirmed a benefit for rests over 60 seconds. So: about 3 minutes on the heavy compound lifts (bench, squat pattern, RDL and deadlift, overhead press, chin-ups), 2 minutes on lighter compounds, 90 seconds on isolation work, 60 seconds on abs. Rest until you can give the next set full effort; the timer is a floor, not a ceiling. <br />
          <b>Between exercises.</b> Take the same rest as the exercise you just finished before starting the next one. <br />
          <b>Between sessions.</b> Training each muscle twice a week beat once a week in the 2016 meta-analysis. Leave 48 to 72 hours before hitting the same muscle again, which this cycle does automatically, and keep at least one full rest day. Sleep 7 to 9 hours; recovery is where the growth happens. <br />
          <b>Progression.</b> When you hit the top of the rep range on every set with reps in reserve, add 5 lb total next time. If you marked a set as your max, keep the weight and work up the reps.
        </div>
      </details>
    </section>
  )
}

function SyncCard({ settings, setSettings, showToast, sync, state, update }) {
  const [token, setToken] = useState(settings.token || '')
  const [busy, setBusy] = useState(false)
  const connect = async () => {
    if (!token.trim()) return
    setBusy(true)
    try {
      const gistId = await findOrCreateGist(token.trim())
      setSettings({ token: token.trim(), gistId })
      showToast('Cloud sync connected')
    } catch (e) { showToast(e.message, true) }
    setBusy(false)
  }
  const disconnect = () => { setSettings({}); setToken(''); showToast('Cloud sync turned off, data stays on this device') }
  const pullNow = async () => {
    setBusy(true)
    try {
      const remote = await pullGist(settings.token, settings.gistId)
      if (remote) { update(() => remote); showToast('Pulled cloud data') }
    } catch (e) { showToast(e.message, true) }
    setBusy(false)
  }
  return (
    <section className="card">
      <div className="card-head"><h2>Cloud sync</h2><span className={'chip ' + (settings.token ? 'teal' : '')}>{settings.token ? 'connected' : 'off'}</span></div>
      <p className="muted small">Your data lives in a private GitHub Gist so your phone and laptop see the same thing. Create a personal access token (classic) on GitHub with only the <b>gist</b> scope and paste it here on each device. The token is stored only in this browser.</p>
      {!settings.token ? (
        <div className="input-row" style={{ marginTop: 12 }}>
          <input className="input mono" type="password" placeholder="ghp_..." value={token} onChange={(e) => setToken(e.target.value)} />
          <button className="btn primary" disabled={busy || !token} onClick={connect}>{busy ? 'Connecting' : 'Connect'}</button>
        </div>
      ) : (
        <div className="btn-row" style={{ marginTop: 12 }}>
          <button className="btn sm" disabled={busy} onClick={pullNow}>Pull from cloud</button>
          <button className="btn sm ghost danger" onClick={disconnect}>Disconnect</button>
          <span className="tiny faint" style={{ alignSelf: 'center' }}>{sync.status === 'err' ? sync.msg : sync.status === 'ok' ? 'Last change synced' : ''}</span>
        </div>
      )}
    </section>
  )
}

function DataCard({ state, update, showToast }) {
  const fileRef = useRef(null)
  const restore = (e) => {
    const f = e.target.files?.[0]; if (!f) return
    const r = new FileReader()
    r.onload = () => {
      try {
        const data = JSON.parse(r.result)
        if (!data.workouts || !data.daily) throw new Error('Not a Fit Tracker backup')
        update(() => ({ ...data, updatedAt: Date.now() })); saveLocal(data); showToast('Backup restored')
      } catch (err) { showToast(err.message, true) }
    }
    r.readAsText(f); e.target.value = ''
  }
  const resetCycle = () => {
    if (!confirm('Reset the cycle start? Logged sessions are kept.')) return
    update((s) => ({ ...s, cycle: { startDate: null, startIndex: 0, skipped: [] } }))
  }
  const wipe = () => {
    if (!confirm('Delete everything on this device? Download a backup first if you want to keep it.')) return
    localStorage.clear(); location.reload()
  }
  const n = Object.keys(state.workouts || {}).length, m = Object.keys(state.daily || {}).length
  return (
    <section className="card">
      <div className="card-head"><h2>Your data</h2><span className="chip">{n} sessions, {m} daily logs</span></div>
      <p className="muted small">Cycle started {state.cycle?.startDate ? fmtDate(state.cycle.startDate, { month: 'short', day: 'numeric', year: 'numeric' }) + ' with ' + dayLabel(CYCLE[state.cycle.startIndex || 0]) : 'not yet'}.</p>
      <div className="btn-row" style={{ marginTop: 12 }}>
        <button className="btn sm" onClick={() => exportJson(state)}>Download backup</button>
        <button className="btn sm" onClick={() => fileRef.current.click()}>Restore backup</button>
        <input ref={fileRef} type="file" accept="application/json" style={{ display: 'none' }} onChange={restore} />
        <button className="btn sm ghost" onClick={resetCycle}>Reset cycle start</button>
        <button className="btn sm ghost danger" onClick={wipe}>Erase device data</button>
      </div>
    </section>
  )
}

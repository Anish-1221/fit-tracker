import { useEffect, useMemo, useRef, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'
import { DAYS, EXERCISES, ALT_LOOKUP, CYCLE, CARDIO_TYPES, FOCUS_LOOKUP, yt, restLabel } from '../data/program'
import { todayKey, addDays, fmtDate, buildSchedule, e1rm, dayLabel } from '../lib/calc'

// ---------- helpers ----------
function lastSession(state, beforeKey, slotId, altId) {
  const keys = Object.keys(state.workouts || {}).filter((k) => k < beforeKey).sort().reverse()
  for (const k of keys) {
    const ex = (state.workouts[k].exercises || []).find((e) => e.slot === slotId && (e.alt || e.slot) === altId)
    if (ex && ex.sets?.some((s) => s.reps)) return { date: k, ...ex }
  }
  return null
}

// Base exercises for a day plus any active focus-block exercises.
export function dayExercises(slot, state) {
  const base = DAYS[slot].exercises
  const extras = Object.values(state.prefs?.focus || {}).flatMap((f) => f.exercises).filter((id) => FOCUS_LOOKUP[id]?.day === slot)
  return [...base, ...extras]
}
const exDef = (id) => EXERCISES[id] || FOCUS_LOOKUP[id]

function parseRange(reps) { const m = String(reps).match(/(\d+)\s*-\s*(\d+)/); return m ? { lo: +m[1], hi: +m[2] } : null }

// Suggested working weight from the last session of this exact exercise,
// applying the program's progression rule.
function recommend(state, dateKey, slotId, altId, ex) {
  const prev = lastSession(state, dateKey, slotId, altId)
  if (!prev) return null
  const sets = prev.sets.filter((s) => s.reps)
  if (!sets.length) return null
  const range = parseRange(ex.reps)
  const top = Math.max(...sets.map((x) => +x.weight || 0))
  const allTop = range ? sets.every((x) => +x.reps >= range.hi) : false
  const anyBelow = range ? sets.some((x) => +x.reps < range.lo) : false
  const unit = ex.timed ? 's' : ' lb'
  if (top === 0) {
    if (ex.timed) return { weight: 0, note: allTop ? `You held ${range.hi}s everywhere: aim past it or slow the breathing.` : `Bodyweight, aim ${range ? range.hi + 's' : 'longer'} each set.` }
    if (allTop && prev.effort !== 'max') return { weight: 5, note: 'All sets hit the top at bodyweight: add a 5 lb dumbbell or slow the tempo.' }
    return { weight: 0, note: `Bodyweight again, build every set to ${range ? range.hi : 'the top'} reps.` }
  }
  if (allTop && prev.effort !== 'max') return { weight: top + 5, note: `Up 5: last time every set reached ${range.hi} with reps to spare.` }
  if (anyBelow) return { weight: top, note: `Same ${top}${unit}: get every set to ${range.lo}+ reps first.` }
  if (allTop) return { weight: top, note: `Same ${top}${unit}: you hit the top but marked it max. When a set feels like it has 1-2 reps spare, go up 5.` }
  return { weight: top, note: `Same ${top}${unit}, push reps toward ${range ? range.hi : 'the top of the range'}.` }
}

function emptyDraft(slot, state, dateKey) {
  const day = DAYS[slot]
  return {
    day: slot,
    exercises: dayExercises(slot, state).map((id) => {
      const alt = state.prefs?.defaultAlts?.[id] || id
      const ex = exDef(id)
      const prev = lastSession(state, dateKey, id, alt)
      const rec = recommend(state, dateKey, id, alt, ex)
      return {
        slot: id, alt,
        sets: Array.from({ length: ex.sets }, (_, i) => ({ weight: rec != null ? (rec.weight || '') : (prev?.sets?.[i]?.weight ?? ''), reps: '' })),
        effort: '', notes: '',
      }
    }),
    cardio: [],
    notes: '',
  }
}

// ---------- cycle dial ----------
function Dial({ schedule, dateKey, state }) {
  const byDate = schedule.byDate
  // Mark each slot of the current loop by how many slots have been consumed.
  const status = CYCLE.map(() => 'upcoming')
  const cycleStart = Math.floor(schedule.index / CYCLE.length) * CYCLE.length
  const consumed = schedule.index - cycleStart
  for (let i = 0; i < CYCLE.length; i++) {
    if (i < consumed) status[i] = CYCLE[i] === 'rest' ? 'rest' : 'done'
    else if (i === consumed) status[i] = 'today'
  }
  const r = 62, c = 75, gap = 0.06
  const segs = CYCLE.map((slot, i) => {
    const a0 = (i / CYCLE.length) * Math.PI * 2 - Math.PI / 2 + gap / 2
    const a1 = ((i + 1) / CYCLE.length) * Math.PI * 2 - Math.PI / 2 - gap / 2
    const x0 = c + r * Math.cos(a0), y0 = c + r * Math.sin(a0)
    const x1 = c + r * Math.cos(a1), y1 = c + r * Math.sin(a1)
    return { d: `M ${x0} ${y0} A ${r} ${r} 0 0 1 ${x1} ${y1}`, cls: status[i], slot }
  })
  const todaySlot = byDate[dateKey]?.slot || schedule.todaySlot
  return (
    <svg viewBox="0 0 150 150" role="img" aria-label="Training cycle position">
      {segs.map((s, i) => <path key={i} d={s.d} className={'seg-path ' + (s.slot === 'rest' ? 'rest ' : '') + s.cls} />)}
      <text x="75" y="70" textAnchor="middle" className="dial-center" fontSize="22">{DAYS[todaySlot]?.short || '-'}</text>
      <text x="75" y="92" textAnchor="middle" fill="var(--text-3)" fontSize="11" fontFamily="var(--font-body)">day {(schedule.index % CYCLE.length) + 1} of 7</text>
    </svg>
  )
}

// ---------- rest timer ----------
function useTimer() {
  const [t, setT] = useState({ total: 0, left: 0, running: false, label: '' })
  const ref = useRef(null)
  useEffect(() => {
    if (!t.running) return
    ref.current = setInterval(() => setT((x) => ({ ...x, left: x.left - 1 })), 1000)
    return () => clearInterval(ref.current)
  }, [t.running])
  useEffect(() => {
    if (t.running && t.left === 0 && navigator.vibrate) navigator.vibrate([200, 100, 200])
  }, [t.left, t.running])
  return {
    t,
    start: (secs, label) => setT({ total: secs, left: secs, running: true, label }),
    stop: () => setT((x) => ({ ...x, running: false, left: 0 })),
    add: (n) => setT((x) => ({ ...x, left: x.left + n })),
  }
}
const mmss = (s) => { const a = Math.abs(s); return (s < 0 ? '+' : '') + String(Math.floor(a / 60)).padStart(2, '0') + ':' + String(a % 60).padStart(2, '0') }

// ---------- main ----------
export default function Today({ state, update, schedule, targets, showToast, flushNow }) {
  const [dateKey, setDateKey] = useState(todayKey())
  const sched = useMemo(() => (dateKey <= todayKey() ? schedule : buildSchedule(state, dateKey)), [schedule, state, dateKey])
  const info = sched.byDate[dateKey]
  const slot = info?.slot
  const saved = state.workouts?.[dateKey]
  const [draft, setDraft] = useState(null)
  const [dirty, setDirty] = useState(false)
  const timer = useTimer()
  const daily = state.daily?.[dateKey] || {}

  useEffect(() => {
    if (saved) setDraft(JSON.parse(JSON.stringify(saved)))
    else if (slot && slot !== 'rest') setDraft(emptyDraft(slot, state, dateKey))
    else setDraft(null)
    setDirty(false)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateKey, slot, saved])

  const setDaily = (patch) => update((s) => ({ ...s, daily: { ...s.daily, [dateKey]: { ...(s.daily?.[dateKey] || {}), ...patch } } }))

  const changeEx = (i, patch) => { setDirty(true); setDraft((d) => ({ ...d, exercises: d.exercises.map((e, j) => (j === i ? { ...e, ...patch } : e)) })) }
  const changeSet = (i, k, patch) => changeEx(i, { sets: draft.exercises[i].sets.map((s, j) => (j === k ? { ...s, ...patch } : s)) })
  const changeAlt = (i, alt) => {
    const ex = draft.exercises[i]
    const prev = lastSession(state, dateKey, ex.slot, alt)
    const rec = recommend(state, dateKey, ex.slot, alt, exDef(ex.slot))
    changeEx(i, { alt, sets: ex.sets.map((s, k) => ({ weight: rec != null ? (rec.weight || '') : (prev?.sets?.[k]?.weight ?? ''), reps: '' })) })
    update((s) => ({ ...s, prefs: { ...s.prefs, defaultAlts: { ...(s.prefs?.defaultAlts || {}), [ex.slot]: alt } } }))
  }

  const save = () => {
    const done = draft.exercises.some((e) => e.sets.some((s) => s.reps))
    if (!done) { showToast('Log at least one set before saving', true); return }
    update((s) => ({ ...s, workouts: { ...s.workouts, [dateKey]: { ...draft, savedAt: Date.now() } } }))
    setDirty(false); showToast('Session saved')
    setTimeout(() => flushNow && flushNow(), 50)
  }
  const remove = () => {
    if (!confirm('Delete this logged session?')) return
    update((s) => { const w = { ...s.workouts }; delete w[dateKey]; return { ...s, workouts: w } })
  }
  const skip = () => {
    if (!confirm('Skip this session and move the cycle forward?')) return
    update((s) => ({ ...s, cycle: { ...s.cycle, skipped: [...(s.cycle.skipped || []), dateKey] } }))
  }
  const unskip = () => update((s) => ({ ...s, cycle: { ...s.cycle, skipped: (s.cycle.skipped || []).filter((d) => d !== dateKey) } }))

  // ---------- no cycle yet ----------
  if (!state.cycle?.startDate) return <StartCycle update={update} />

  const day = slot ? DAYS[slot] : null
  const stepGoal = targets ? (slot === 'abs' ? targets.absDaySteps : targets.steps) : 10000

  return (
    <>
      <section className="card">
        <div className="dial">
          <Dial schedule={sched} dateKey={dateKey} state={state} />
          <div>
            <div className="eyebrow">{dateKey === todayKey() ? 'Today' : fmtDate(dateKey, { weekday: 'long', month: 'short', day: 'numeric' })}</div>
            <h1 style={{ marginTop: 4 }}>{day?.label || 'No session'}</h1>
            <p className="muted small" style={{ marginTop: 6 }}>
              {info?.status === 'done' && 'Logged. Nice work.'}
              {info?.status === 'missed' && 'This session was missed. It stays here until you log it or skip it.'}
              {info?.status === 'planned' && day?.kind === 'lift' && `${dayExercises(slot, state).length} exercises, ${dayExercises(slot, state).reduce((a, id) => a + exDef(id).sets, 0)} working sets.`}
              {info?.status === 'planned' && day?.kind === 'abs' && `Short core session plus cardio. Aim for ${stepGoal.toLocaleString()} steps today.`}
              {info?.status === 'rest' && 'Rest day. Walk, stretch, eat your protein. Muscles grow on these days.'}
              {info?.status === 'skipped' && 'Skipped. The cycle moved on.'}
            </p>
            <div className="btn-row" style={{ marginTop: 12 }}>
              <button className="btn sm ghost" onClick={() => setDateKey(addDays(dateKey, -1))}>Prev day</button>
              <input type="date" className="input" style={{ width: 'auto', minHeight: 34, padding: '4px 10px' }} value={dateKey} max={todayKey()} onChange={(e) => e.target.value && setDateKey(e.target.value)} />
              <button className="btn sm ghost" disabled={dateKey >= todayKey()} onClick={() => setDateKey(addDays(dateKey, 1))}>Next day</button>
              {dateKey !== todayKey() && <button className="btn sm" onClick={() => setDateKey(todayKey())}>Today</button>}
            </div>
          </div>
        </div>
        {sched.upcoming && dateKey === todayKey() && (
          <div className="last" style={{ marginTop: 14 }}>
            <span>Next:</span>
            {sched.upcoming.slice(0, 6).map((u) => <span key={u.date}><b>{DAYS[u.slot].short}</b> {fmtDate(u.date, { weekday: 'short' })}</span>)}
          </div>
        )}
      </section>

      {/* Daily steps always available */}
      <section className="card">
        <div className="card-head"><h2>Activity</h2><span className="chip">{stepGoal.toLocaleString()} step goal</span></div>
        <div className="grid grid-2">
          <div className="field">
            <label>Steps</label>
            <div className="input-row"><input className="input mono" type="number" inputMode="numeric" placeholder="e.g. 10500" value={daily.steps ?? ''} onChange={(e) => setDaily({ steps: e.target.value })} /></div>
          </div>
          {slot === 'abs' && draft && (
            <div className="field">
              <label>Cardio on this day</label>
              {(draft.cardio || []).map((c, i) => (
                <div className="input-row" key={i}>
                  <select className="input" value={c.type} onChange={(e) => { setDirty(true); setDraft((d) => ({ ...d, cardio: d.cardio.map((x, j) => (j === i ? { ...x, type: e.target.value } : x)) })) }}>
                    {CARDIO_TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                  <input className="input mono" type="number" placeholder="min" style={{ maxWidth: 90 }} value={c.minutes} onChange={(e) => { setDirty(true); setDraft((d) => ({ ...d, cardio: d.cardio.map((x, j) => (j === i ? { ...x, minutes: e.target.value } : x)) })) }} />
                  <button className="btn sm ghost" onClick={() => { setDirty(true); setDraft((d) => ({ ...d, cardio: d.cardio.filter((_, j) => j !== i) })) }}>x</button>
                </div>
              ))}
              <button className="btn sm" onClick={() => { setDirty(true); setDraft((d) => ({ ...d, cardio: [...(d.cardio || []), { type: 'Incline walk', minutes: '' }] })) }}>Add cardio</button>
              <span className="tiny faint">Target 20 to 30 min of easy cardio on abs day, on top of the step goal.</span>
            </div>
          )}
        </div>
      </section>

      {/* Session */}
      {draft && day && (
        <section className="card">
          <div className="card-head">
            <h2>{day.label} session</h2>
            <div className="btn-row">
              {saved && <button className="btn sm danger ghost" onClick={remove}>Delete</button>}
              {!saved && info?.status !== 'rest' && <button className="btn sm ghost" onClick={skip}>Skip session</button>}
            </div>
          </div>
          {draft.exercises.map((e, i) => {
            const ex = exDef(e.slot)
            if (!ex) return null
            const isFocus = !!FOCUS_LOOKUP[e.slot]
            const alt = ALT_LOOKUP[e.alt] || { name: ex.name, muscles: ex.muscles }
            const prev = lastSession(state, dateKey, e.slot, e.alt)
            const complete = e.sets.every((s) => s.reps)
            const perLeg = /per/.test(ex.reps)
            return (
              <div className={'exercise' + (complete ? ' done' : '')} key={e.slot}>
                <div className="ex-head">
                  <div className="ex-title">
                    <div>
                      <h3>{alt.name}</h3>
                      <div className="ex-meta">
                        <span>{alt.muscles}</span>
                        <span>{ex.pattern}</span>
                      </div>
                    </div>
                    <div className="ex-meta">
                      {isFocus && <span className="chip teal">focus</span>}
                      <span className="chip accent mono">{ex.sets} x {ex.reps}</span>
                      <span className="chip">rest {restLabel(ex.rest)}</span>
                      <a className="chip" href={yt(alt.name)} target="_blank" rel="noreferrer">Form video</a>
                    </div>
                  </div>
                  <select className="input" value={e.alt} onChange={(ev) => changeAlt(i, ev.target.value)}>
                    {ex.alternatives.map((a, n) => (
                      <option key={a.id} value={a.id}>{n === 0 ? 'Easiest: ' : ''}{a.name}{a.discussed ? ' (discussed)' : ''}</option>
                    ))}
                  </select>
                  {(() => { const a = ex.alternatives.find((x) => x.id === e.alt); return a?.note ? <span className="tiny faint">{a.note}. Targets {a.muscles.toLowerCase()}. Options are ordered easiest first.</span> : null })()}
                </div>

                {(() => { const rec = recommend(state, dateKey, e.slot, e.alt, ex); return rec && !saved ? (
                  <div className="last" style={{ marginTop: 8 }}>
                    <span className="accent">Suggested:</span>
                    <b>{ex.timed ? 'bodyweight' : rec.weight ? rec.weight + ' lb all sets' : 'bodyweight'}</b>
                    <span>{rec.note}</span>
                    {rec.weight >= 20 && ex.rest >= 120 && <span className="faint">Warm up with about half that for 8 easy reps first, don't log it.</span>}
                  </div>
                ) : null })()}
                {prev && (
                  <div className="last">
                    <span>Last ({fmtDate(prev.date)}):</span>
                    {prev.sets.filter((s) => s.reps).map((s, k) => <b key={k}>{s.weight || 'bw'}{s.weight ? ' lb' : ''} x {s.reps}</b>)}
                    {prev.effort && <span className={prev.effort === 'max' ? 'rose' : 'teal'}>{prev.effort === 'max' ? 'was max' : 'had more'}</span>}
                  </div>
                )}

                <div className="sets">
                  <span className="hdr">Set</span><span className="hdr">{ex.timed ? 'Weight (lb)' : 'Weight (lb)'}</span><span className="hdr">{ex.timed ? 'Seconds' : perLeg ? 'Reps / leg' : 'Reps'}</span><span />
                  {e.sets.map((s, k) => (
                    <FragmentRow key={k}>
                      <span className="idx">{k + 1}</span>
                      <input className="input mono" type="number" inputMode="decimal" placeholder="0" value={s.weight} onChange={(ev) => changeSet(i, k, { weight: ev.target.value })} />
                      <input className="input mono" type="number" inputMode="numeric" placeholder={ex.reps.split(' ')[0]} value={s.reps} onChange={(ev) => changeSet(i, k, { reps: ev.target.value })} />
                      <button className="btn sm ghost" title="Start rest" onClick={() => timer.start(ex.rest, alt.name)} aria-label="Start rest timer">⏱</button>
                    </FragmentRow>
                  ))}
                </div>

                <div className="btn-row" style={{ marginTop: 12, alignItems: 'center', justifyContent: 'space-between' }}>
                  <div className="seg">
                    <button className={e.effort === 'more' ? 'active good' : ''} onClick={() => changeEx(i, { effort: e.effort === 'more' ? '' : 'more' })}>Had more in the tank</button>
                    <button className={e.effort === 'max' ? 'active warn' : ''} onClick={() => changeEx(i, { effort: e.effort === 'max' ? '' : 'max' })}>That was my max</button>
                  </div>
                  <div className="btn-row">
                    <button className="btn sm ghost" onClick={() => changeEx(i, { sets: [...e.sets, { weight: '', reps: '' }] })}>+ set</button>
                    {e.sets.length > 1 && <button className="btn sm ghost" onClick={() => changeEx(i, { sets: e.sets.slice(0, -1) })}>- set</button>}
                  </div>
                </div>
                <textarea className="input" style={{ marginTop: 10, minHeight: 44 }} placeholder="Notes (form cues, how it felt, seat setting)" value={e.notes} onChange={(ev) => changeEx(i, { notes: ev.target.value })} />
              </div>
            )
          })}
          <textarea className="input" style={{ marginTop: 14 }} placeholder="Session notes" value={draft.notes || ''} onChange={(e) => { setDirty(true); setDraft((d) => ({ ...d, notes: e.target.value })) }} />
          <div className="btn-row" style={{ marginTop: 14, justifyContent: 'flex-end' }}>
            <button className="btn primary" onClick={save}>{saved ? (dirty ? 'Save changes' : 'Saved') : 'Save session'}</button>
          </div>
        </section>
      )}

      {info?.status === 'skipped' && <section className="card"><p className="muted">This day was skipped. <button className="btn sm" onClick={unskip}>Undo skip</button></p></section>}

      <Progress state={state} />

      {timer.t.running && (
        <div className={'sticky-timer'}>
          <span className="tiny faint" style={{ maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{timer.t.label}</span>
          <span className={'mono ' + (timer.t.left <= 0 ? 'teal' : '')} style={{ fontSize: 20, fontWeight: 600 }}>{mmss(timer.t.left)}</span>
          <button className="btn sm ghost" onClick={() => timer.add(30)}>+30</button>
          <button className="btn sm" onClick={timer.stop}>Done</button>
        </div>
      )}
    </>
  )
}

const FragmentRow = ({ children }) => <>{children}</>

// ---------- start cycle ----------
function StartCycle({ update }) {
  const [start, setStart] = useState(todayKey())
  const [first, setFirst] = useState('upper1')
  return (
    <section className="card">
      <div className="eyebrow">Set up your cycle</div>
      <h1 style={{ margin: '6px 0 10px' }}>When does the cycle start?</h1>
      <p className="muted small">The program repeats in a seven-day loop: Upper 1, Lower 1, rest, Upper 2, Lower 2, abs and cardio, rest. Pick the first day and which session you start with. After this the site picks each day for you; if you miss a session, it waits for you and the rest days shift.</p>
      <div className="grid grid-2" style={{ marginTop: 16 }}>
        <div className="field"><label>First day</label><input type="date" className="input" value={start} onChange={(e) => setStart(e.target.value)} /></div>
        <div className="field"><label>Start with</label>
          <select className="input" value={first} onChange={(e) => setFirst(e.target.value)}>
            {CYCLE.filter((c) => c !== 'rest').map((c) => <option key={c} value={c}>{dayLabel(c)}</option>)}
          </select>
        </div>
      </div>
      <div className="btn-row" style={{ marginTop: 16 }}>
        <button className="btn primary" onClick={() => update((s) => ({ ...s, cycle: { startDate: start, startIndex: CYCLE.indexOf(first), skipped: [] } }))}>Start cycle</button>
      </div>
    </section>
  )
}

// ---------- progress ----------
function Progress({ state }) {
  const options = useMemo(() => {
    const seen = new Map()
    Object.entries(state.workouts || {}).forEach(([d, w]) => (w.exercises || []).forEach((e) => {
      if (e.sets?.some((s) => s.reps)) { const k = e.alt || e.slot; seen.set(k, (seen.get(k) || 0) + 1) }
    }))
    return [...seen.keys()].map((k) => ({ id: k, name: ALT_LOOKUP[k]?.name || EXERCISES[k]?.name || FOCUS_LOOKUP[k]?.name || k }))
  }, [state.workouts])
  const [sel, setSel] = useState('')
  const [metric, setMetric] = useState('top')
  const id = sel || options[0]?.id
  const data = useMemo(() => {
    if (!id) return []
    return Object.keys(state.workouts || {}).sort().map((d) => {
      const e = (state.workouts[d].exercises || []).find((x) => (x.alt || x.slot) === id)
      if (!e) return null
      const sets = e.sets.filter((s) => s.reps)
      if (!sets.length) return null
      const top = Math.max(...sets.map((s) => +s.weight || 0))
      const best = sets.reduce((a, s) => Math.max(a, e1rm(+s.weight || 0, +s.reps)), 0)
      const vol = sets.reduce((a, s) => a + (+s.weight || 0) * (+s.reps), 0)
      const reps = sets.reduce((a, s) => a + +s.reps, 0)
      return { date: fmtDate(d), top, best, vol, reps, effort: e.effort }
    }).filter(Boolean)
  }, [state.workouts, id])

  if (!options.length) return (
    <section className="card"><div className="eyebrow">Progress</div><p className="muted small" style={{ marginTop: 6 }}>Once you log a few sessions, each exercise gets a chart here: top set weight, total volume and estimated one-rep max, so week over week improvement is obvious.</p></section>
  )
  const labels = { top: 'Top set weight (lb)', best: 'Estimated 1RM (lb)', vol: 'Total volume (lb)', reps: 'Total reps' }
  const last = data[data.length - 1], prev = data[data.length - 2]
  return (
    <section className="card">
      <div className="card-head"><h2>Progress</h2>
        <div className="seg">{Object.keys(labels).map((m) => <button key={m} className={metric === m ? 'active' : ''} onClick={() => setMetric(m)}>{m === 'top' ? 'Top' : m === 'best' ? '1RM' : m === 'vol' ? 'Volume' : 'Reps'}</button>)}</div>
      </div>
      <select className="input" value={id} onChange={(e) => setSel(e.target.value)} style={{ marginBottom: 12 }}>
        {options.map((o) => <option key={o.id} value={o.id}>{o.name}</option>)}
      </select>
      {last && (
        <div className="stat-row" style={{ marginBottom: 12 }}>
          <div><div className="eyebrow">Latest</div><div className="stat">{last[metric]}</div></div>
          {prev && <div><div className="eyebrow">vs previous</div><div className={'stat ' + (last[metric] - prev[metric] > 0 ? 'teal' : last[metric] - prev[metric] < 0 ? 'rose' : '')}>{last[metric] - prev[metric] > 0 ? '+' : ''}{Math.round((last[metric] - prev[metric]) * 10) / 10}</div></div>}
          <div><div className="eyebrow">Sessions</div><div className="stat">{data.length}</div></div>
        </div>
      )}
      <div style={{ height: 220 }}>
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 8, right: 8, left: -14, bottom: 0 }}>
            <CartesianGrid stroke="#262C38" vertical={false} />
            <XAxis dataKey="date" stroke="#7B8494" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="#7B8494" fontSize={11} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
            <Tooltip contentStyle={{ background: '#1C212C', border: '1px solid #343B4A', borderRadius: 9, fontSize: 12 }} labelStyle={{ color: '#B8BFCC' }} itemStyle={{ color: '#fff' }} formatter={(v) => [v, labels[metric]]} />
            <Line type="monotone" dataKey={metric} stroke="#F2A93B" strokeWidth={2.5} dot={{ r: 4, fill: '#F2A93B', strokeWidth: 0 }} activeDot={{ r: 6 }} isAnimationActive={false} />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <p className="tiny faint" style={{ marginTop: 8 }}>Progression rule for this program: once you hit the top of the rep range on every set with reps to spare, add 5 lb (2.5 lb per dumbbell) next session. If you marked "max", keep the weight and chase reps.</p>
    </section>
  )
}

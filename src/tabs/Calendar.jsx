import { useMemo, useState } from 'react'
import { DAYS } from '../data/program'
import { todayKey, toKey, fromKey, dayScore, streak, fmtDate } from '../lib/calc'

const DOW = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const LABELS = { workout: 'Workout', calories: 'Calories', protein: 'Protein', steps: 'Steps' }

export default function Calendar({ state, schedule, targets }) {
  const today = todayKey()
  const [month, setMonth] = useState(() => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1) })
  const [sel, setSel] = useState(today)

  const cells = useMemo(() => {
    const first = new Date(month.getFullYear(), month.getMonth(), 1)
    const pad = (first.getDay() + 6) % 7
    const days = new Date(month.getFullYear(), month.getMonth() + 1, 0).getDate()
    const out = Array.from({ length: pad }, () => null)
    for (let i = 1; i <= days; i++) out.push(toKey(new Date(month.getFullYear(), month.getMonth(), i)))
    return out
  }, [month])

  const current = useMemo(() => streak(state, schedule, targets), [state, schedule, targets])
  const best = useMemo(() => {
    // longest run of level>=2 days in history
    const keys = new Set([...Object.keys(state.daily || {}), ...Object.keys(state.workouts || {})])
    if (!keys.size) return 0
    const sorted = [...keys].sort()
    let run = 0, max = 0, prev = null
    for (const k of sorted) {
      const ok = dayScore(state, k, schedule, targets).level >= 2
      if (ok && prev && fromKey(k) - fromKey(prev) === 86400000) run++
      else run = ok ? 1 : 0
      prev = k
      max = Math.max(max, run)
    }
    return max
  }, [state, schedule, targets])

  const monthStats = useMemo(() => {
    const ks = cells.filter((k) => k && k <= today)
    const scores = ks.map((k) => dayScore(state, k, schedule, targets))
    return { full: scores.filter((s) => s.level === 3).length, partial: scores.filter((s) => s.level === 2).length, logged: scores.filter((s) => s.level >= 1).length }
  }, [cells, state, schedule, targets, today])

  const selScore = dayScore(state, sel, schedule, targets)
  const selSched = schedule.byDate[sel]

  return (
    <>
      <section className="card">
        <div className="stat-row">
          <div><div className="eyebrow">Current streak</div><div className="stat accent">{current}<small>days</small></div></div>
          <div><div className="eyebrow">Best streak</div><div className="stat">{best}<small>days</small></div></div>
          <div><div className="eyebrow">Full days this month</div><div className="stat teal">{monthStats.full}</div></div>
          <div><div className="eyebrow">Partial</div><div className="stat">{monthStats.partial}</div></div>
        </div>
        <p className="tiny faint" style={{ marginTop: 10 }}>A day counts toward the streak when you hit at least half your targets (workout if scheduled, calories, protein, steps). A full day hits all of them. Rest days only need the nutrition and step targets.</p>
      </section>

      <section className="card">
        <div className="card-head">
          <h2>{month.toLocaleDateString(undefined, { month: 'long', year: 'numeric' })}</h2>
          <div className="btn-row">
            <button className="btn sm ghost" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}>Prev</button>
            <button className="btn sm ghost" onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}>Next</button>
          </div>
        </div>
        <div className="cal">
          {DOW.map((d) => <div className="dow" key={d}>{d}</div>)}
          {cells.map((k, i) => {
            if (!k) return <div className="cell empty" key={'e' + i} />
            const future = k > today
            const s = future ? { level: 0 } : dayScore(state, k, schedule, targets)
            const sc = schedule.byDate[k]
            return (
              <div key={k} className={'cell' + (future ? ' future' : ' l' + s.level) + (k === today ? ' today' : '') + (k === sel ? ' selected' : '')} onClick={() => !future && setSel(k)}>
                <span className="mono">{+k.slice(-2)}</span>
                {sc && <span className="slotlbl">{DAYS[sc.slot]?.short}</span>}
              </div>
            )
          })}
        </div>
        <div className="legend">
          <span><i style={{ background: 'var(--bg-2)', border: '1px solid var(--line)' }} />nothing logged</span>
          <span><i style={{ background: 'rgba(242,169,59,.12)' }} />logged</span>
          <span><i style={{ background: 'rgba(242,169,59,.3)' }} />half or more</span>
          <span><i style={{ background: 'var(--accent)' }} />all targets</span>
        </div>
      </section>

      <section className="card">
        <div className="card-head"><h2>{fmtDate(sel, { weekday: 'long', month: 'short', day: 'numeric' })}</h2>
          {selSched && <span className="chip">{DAYS[selSched.slot]?.label} {selSched.status !== 'rest' && selSched.status !== 'planned' ? '- ' + selSched.status : ''}</span>}
        </div>
        {selScore.checks.length === 0 ? <p className="muted small">No targets for this day.</p> : (
          <table>
            <tbody>
              {selScore.checks.map((c) => {
                const d = state.daily?.[sel] || {}
                const goal = c.key === 'calories' ? targets.calories + ' kcal' : c.key === 'protein' ? targets.protein + ' g' : c.key === 'steps' ? (selSched?.slot === 'abs' ? targets.absDaySteps : targets.steps).toLocaleString() : DAYS[selSched?.slot]?.label
                const val = c.key === 'workout' ? (selSched?.status === 'done' ? 'logged' : selSched?.status) : d[c.key] ? (+d[c.key]).toLocaleString() : '-'
                return <tr key={c.key}><td>{LABELS[c.key]}</td><td className="num">{val}</td><td className="num faint">{goal}</td><td className="num"><span className={'chip ' + (c.ok ? 'teal' : c.empty ? '' : 'rose')}>{c.ok ? 'hit' : c.empty ? 'not logged' : 'missed'}</span></td></tr>
              })}
            </tbody>
          </table>
        )}
        {state.workouts?.[sel] && (
          <div style={{ marginTop: 12 }} className="small muted">
            {state.workouts[sel].exercises.filter((e) => e.sets.some((s) => s.reps)).map((e) => (
              <div key={e.slot} style={{ padding: '4px 0' }}>
                <span className="mono" style={{ color: 'var(--text)' }}>{e.sets.filter((s) => s.reps).map((s) => `${s.weight || 'bw'}x${s.reps}`).join('  ')}</span>
                <span className="faint"> {e.effort === 'max' ? '(max)' : e.effort === 'more' ? '(had more)' : ''}</span>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  )
}

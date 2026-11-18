import { useMemo, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts'
import { todayKey, addDays, fmtDate, diffDays, weekKey, hairHabitsAt, setHairHabits } from '../lib/calc'

// Habits for the daily checklist. Retired ones stay defined so older logs
// and phases still read correctly, but they are no longer offered.
export const HAIR_HABITS = {
  oral_am: { short: 'AM dose', label: 'Oral tablet, morning', per: 7, how: 'Same time every morning, with water, with or without food. Use a pill cutter for half tablets; breaking by hand gives uneven doses. If you miss a dose, skip it; never double up.' },
  oral_pm: { short: 'PM dose', label: 'Oral tablet, evening', per: 7, how: 'About 12 hours after the morning dose. Added after the first week only if the single daily dose caused no headaches, dizziness, pounding heartbeat or ankle swelling.' },
  topical: { short: 'Topical', label: 'Topical solution on the scalp', per: 7, how: 'About 1 mL once a day on a completely dry scalp: front hairline and temples, top, crown. Not the sides or back, which are resistant to the hormone behind pattern loss. Leave on at least 4 hours before washing. Full steps are on the Treatment card.' },
  pso: { short: 'Pumpkin', label: 'Pumpkin seed oil or seeds with food', per: 7, how: '1 tsp cold-pressed pumpkin seed oil or about 30 g of seeds. Optional now: finasteride works on the same DHT pathway far more strongly. Fine to finish what you have, then turn this off in Routine settings. Counts toward your fat and calories.' },
  protein: { short: 'Protein', label: 'Hit protein target', per: 7, how: 'Hair is keratin; under-eating protein in a deficit is a common cause of diffuse shedding. Ticks itself from the nutrition log.' },
  sleep: { short: 'Sleep', label: '7 or more hours sleep', per: 7, how: 'Poor sleep and stress push follicles into the shedding phase. The easiest lever to lose on a PhD schedule.' },
  gentle: { short: 'Gentle', label: 'Gentle wash and handling', per: 7, how: 'Daily washing is fine (Punyani 2021: daily beat once-weekly on every scalp and hair measure). Lukewarm water, shampoo worked into the scalp with fingertips, conditioner only on the lengths. Pat dry, wide comb. Apply the topical only once the scalp is fully dry, and leave at least 4 hours between applying it and the next wash. Hair in the drain was already shedding; washing releases it, it does not cause it.' },
  massage: { short: 'Massage', label: 'Scalp massage, 4 to 5 min', per: 7, retired: true, how: 'Fingertips, firm circular pressure over crown and front. Koyama 2016: daily for 24 weeks increased hair thickness.' },
  rosemary: { short: 'Rosemary', label: 'Rosemary oil on the scalp', per: 5, freq: '5 nights a week', retired: true, how: 'A few drops in a light carrier, worked into the thinning areas, left on for hours then shampooed out. Panahi 2015 matched minoxidil 2% at 6 months.' },
}

const habitLabel = (k, hair) => {
  const t = hair?.treatment
  if (t && k === 'oral_am') return `${t.oralName}, morning`
  if (t && k === 'oral_pm') return `${t.oralName}, evening`
  if (t && k === 'topical') return `${t.topicalName}, ${t.topicalDose}`
  return HAIR_HABITS[k]?.label || k
}

const NATURAL_CHECKPOINTS = [
  { week: 0, title: 'Baseline', text: 'Take four photos in the same bathroom light: hairline straight on, top down, crown from behind, and your part. Dry hair, phone at the same height. Book a dermatologist visit and ask for ferritin, vitamin D, zinc, B12 and TSH.' },
  { week: 4, title: 'Settle in', text: 'Shedding can briefly rise in the first 4 to 8 weeks as follicles cycle. Judge nothing yet; aim for 6 of 7 days on every habit.' },
  { week: 12, title: 'First checkpoint', text: 'Retake the four photos. Look only for less shedding and any fine new hairs at the hairline. Correct any deficiency the labs found.' },
  { week: 24, title: 'Main checkpoint', text: 'Compare photos side by side. Clearly worse: the natural options have had a fair trial; talk to the dermatologist about medication.' },
  { week: 52, title: 'One year', text: 'Pattern hair loss is lifelong, so whatever is working has to continue. Quarterly photos, yearly labs.' },
]

const TREATMENT_CHECKPOINTS = [
  { week: 0, title: 'Start', text: 'Week 1: the oral dose once a day and the topical once a day. Your baseline photos from before starting are what everything gets compared against, so keep them safe. Watch for headaches, dizziness or a pounding heartbeat this week.' },
  { week: 1, title: 'Step up', text: 'If week 1 had no side effects, add the evening dose with the button on the Treatment card, about 12 hours after the morning one. If anything felt off, stay on once a day and tell the clinic.' },
  { week: 2, title: 'Shedding window', text: 'Shedding often rises between weeks 2 and 8. Minoxidil pushes resting hairs out so new, thicker ones can replace them, so a rise here means it is working. Do not stop. Keep the weekly shed count going so you can see it settle.' },
  { week: 8, title: 'Follow-up visit', text: 'Dermatologist follow-up. Bring the photos and the shed-count trend, report any side effects and when they started, ask about rechecking any labs that were off, and ask whether a cheaper option than the compounded topical makes sense.' },
  { week: 12, title: 'Photos and labs', text: 'Retake the four photos in the same light. Recheck any labs that were off at baseline. Shedding should be back near your baseline count by now.' },
  { week: 24, title: 'Main checkpoint', text: 'Six months is when most people see visible change, and the crown responds best. Compare photos side by side with baseline. Improved or stable: continue. No change: talk to the dermatologist about a stronger topical, oral finasteride, or adding procedures.' },
  { week: 52, title: 'One year', text: 'Finasteride keeps improving density for one to two years. Stopping either drug loses the gains over the following months, so this is a long-term routine. Quarterly photos and yearly labs from here.' },
]

export default function Hair({ state, update, showToast, targets }) {
  const hair = state.hair
  if (!hair?.startDate) return <Start update={update} />
  return (
    <>
      {!hair.treatment && <StartTreatment hair={hair} update={update} showToast={showToast} />}
      <Timeline hair={hair} />
      <Daily state={state} update={update} targets={targets} />
      {hair.treatment && <Treatment hair={hair} update={update} showToast={showToast} />}
      <Adherence state={state} targets={targets} />
      <Sheds state={state} update={update} showToast={showToast} />
      <Checkins state={state} update={update} showToast={showToast} />
      <Evidence />
      <Settings state={state} update={update} />
    </>
  )
}

function Start({ update }) {
  const [start, setStart] = useState(todayKey())
  const offered = Object.keys(HAIR_HABITS).filter((k) => !HAIR_HABITS[k].retired)
  const [on, setOn] = useState(Object.fromEntries(offered.map((k) => [k, !k.startsWith('oral') && k !== 'topical'])))
  return (
    <section className="card">
      <div className="eyebrow">Hair routine</div>
      <h1 style={{ margin: '6px 0 10px' }}>Set up your routine</h1>
      <p className="muted small">A daily checklist, a timeline with checkpoints so you know when to judge it, a weekly shed count and monthly photo check-ins. If a dermatologist has prescribed treatment, start the routine first and then add the treatment plan.</p>
      <div className="grid" style={{ marginTop: 14 }}>
        {offered.map((k) => (
          <label key={k} className="note" style={{ display: 'flex', gap: 12, alignItems: 'flex-start', cursor: 'pointer' }}>
            <input type="checkbox" checked={on[k]} onChange={(e) => setOn({ ...on, [k]: e.target.checked })} style={{ marginTop: 3 }} />
            <span><b>{HAIR_HABITS[k].label}</b><br /><span className="faint">{HAIR_HABITS[k].how}</span></span>
          </label>
        ))}
      </div>
      <div className="grid grid-2" style={{ marginTop: 14 }}>
        <div className="field"><label>Start date</label><input type="date" className="input" value={start} max={todayKey()} onChange={(e) => setStart(e.target.value)} /></div>
      </div>
      <div className="btn-row" style={{ marginTop: 14, justifyContent: 'flex-end' }}>
        <button className="btn primary" onClick={() => update((s) => ({ ...s, hair: { startDate: start, habits: on, phases: [{ from: start, habits: on }], inStreak: true, log: {}, checkins: {} } }))}>Start routine</button>
      </div>
    </section>
  )
}

function Timeline({ hair }) {
  const t = hair.treatment
  const points = t ? TREATMENT_CHECKPOINTS : NATURAL_CHECKPOINTS
  const from = t ? t.start : hair.startDate
  const week = Math.max(0, Math.floor(diffDays(from, todayKey()) / 7))
  const nextIdx = points.findIndex((c) => c.week > week)
  const current = [...points].reverse().find((c) => c.week <= week) || points[0]
  const next = points[nextIdx]
  return (
    <section className="card">
      <div className="card-head"><h2>{t ? 'Treatment week' : 'Week'} {week}</h2><span className="chip">since {fmtDate(from)}</span></div>
      <div style={{ display: 'flex', gap: 4, margin: '6px 0 14px' }}>
        {points.slice(0, -1).map((c, i) => {
          const span = points[i + 1].week - c.week
          const done = Math.min(Math.max(week - c.week, 0), span)
          return <div key={i} style={{ flex: span, height: 6, borderRadius: 3, background: 'var(--line-2)', overflow: 'hidden' }}><div style={{ width: (done / span) * 100 + '%', height: '100%', background: 'var(--accent)' }} /></div>
        })}
      </div>
      <div className="note"><b>{current.title} (week {current.week})</b><br /><span className="muted">{current.text}</span></div>
      {next && <p className="small faint" style={{ marginTop: 10 }}>Next: <b className="muted">{next.title}</b> in week {next.week}, around {fmtDate(addDays(from, next.week * 7))}.</p>}
      {t && <p className="tiny faint" style={{ marginTop: 6 }}>Natural routine ran from {fmtDate(hair.startDate)} until {fmtDate(t.start)}; its logs are kept.</p>}
    </section>
  )
}

function Daily({ state, update, targets }) {
  const [dateKey, setDateKey] = useState(todayKey())
  const hair = state.hair
  const log = hair.log?.[dateKey] || {}
  const daily = state.daily?.[dateKey] || {}
  const habits = hairHabitsAt(hair, dateKey)
  const enabled = Object.keys(HAIR_HABITS).filter((k) => habits[k])
  const toggle = (k) => update((s) => ({ ...s, hair: { ...s.hair, log: { ...s.hair.log, [dateKey]: { ...(s.hair.log?.[dateKey] || {}), [k]: !s.hair.log?.[dateKey]?.[k] } } } }))
  const proteinAuto = targets && daily.protein ? +daily.protein >= targets.protein : null
  const done = enabled.filter((k) => (k === 'protein' && proteinAuto != null ? proteinAuto : log[k])).length
  return (
    <section className="card">
      <div className="card-head"><h2>Today's routine</h2>
        <div className="datenav">
          <button className="btn sm ghost" onClick={() => setDateKey(addDays(dateKey, -1))}>Prev</button>
          <input type="date" className="input" value={dateKey} max={todayKey()} onChange={(e) => e.target.value && setDateKey(e.target.value)} />
          <button className="btn sm ghost" disabled={dateKey >= todayKey()} onClick={() => setDateKey(addDays(dateKey, 1))}>Next</button>
        </div>
      </div>
      <div className="grid">
        {enabled.map((k) => {
          const h = HAIR_HABITS[k]
          const auto = k === 'protein' && proteinAuto != null
          const checked = auto ? proteinAuto : !!log[k]
          return (
            <button key={k} className="note" style={{ display: 'flex', gap: 12, alignItems: 'center', textAlign: 'left', borderColor: checked ? 'rgba(95,179,161,.5)' : undefined, cursor: auto ? 'default' : 'pointer' }} onClick={() => !auto && toggle(k)}>
              <span className={'chip ' + (checked ? 'teal' : '')} style={{ width: 26, height: 26, padding: 0, justifyContent: 'center' }}>{checked ? '✓' : ''}</span>
              <span style={{ flex: 1 }}><b>{habitLabel(k, hair)}</b>{auto && <span className="tiny faint"> from nutrition log</span>}{h.freq && <span className="tiny faint"> {h.freq}, doesn't block the day</span>}</span>
            </button>
          )
        })}
      </div>
      <p className="tiny faint" style={{ marginTop: 10 }}>{done} of {enabled.length} done.{hair.treatment ? ' Application steps and side effects are on the Treatment card.' : ''}</p>
    </section>
  )
}

// ---------- treatment ----------
const TREATMENT_DEFAULTS = { oralName: 'Oral minoxidil', oralDose: '1.25 mg (half a 2.5 mg tablet)', topicalName: 'Minoxidil + finasteride solution', topicalDose: '1 mL' }

function TreatmentFields({ f, setF }) {
  return (
    <div className="grid grid-2" style={{ marginTop: 12 }}>
      <div className="field"><label>Oral medication</label><input className="input" value={f.oralName} onChange={(e) => setF({ ...f, oralName: e.target.value })} /></div>
      <div className="field"><label>Dose per tablet taken</label><input className="input" value={f.oralDose} onChange={(e) => setF({ ...f, oralDose: e.target.value })} /></div>
      <div className="field"><label>Topical</label><input className="input" value={f.topicalName} onChange={(e) => setF({ ...f, topicalName: e.target.value })} /></div>
      <div className="field"><label>Amount per day</label><input className="input" value={f.topicalDose} onChange={(e) => setF({ ...f, topicalDose: e.target.value })} /></div>
      <div className="field"><label>Follow-up visit (optional)</label><input type="date" className="input" value={f.followUp || ''} onChange={(e) => setF({ ...f, followUp: e.target.value })} /></div>
    </div>
  )
}

function StartTreatment({ hair, update, showToast }) {
  const [f, setF] = useState({ ...TREATMENT_DEFAULTS, start: todayKey(), followUp: '', retire: true, pso: !!hair.habits?.pso })
  const go = () => {
    const habits = { ...(hair.habits || {}), oral_am: true, oral_pm: false, topical: true, pso: f.pso }
    if (f.retire) { habits.massage = false; habits.rosemary = false }
    const { retire, pso, ...t } = f
    update((s) => ({ ...s, hair: { ...setHairHabits(s.hair, habits, f.start), treatment: t } }))
    showToast('Treatment plan added')
  }
  return (
    <section className="card">
      <div className="card-head"><h2>Start your treatment plan</h2><span className="chip accent">to do</span></div>
      <p className="muted small">Your checklist still shows the old natural routine until you tap Start treatment below. This replaces it with your oral doses and the topical, and switches the timeline to treatment milestones. Days before the start date keep the habits you were doing then, so past streaks don't change.</p>
      <TreatmentFields f={f} setF={setF} />
      <div className="grid grid-2" style={{ marginTop: 4 }}>
        <div className="field"><label>Start date</label><input type="date" className="input" value={f.start} max={todayKey()} onChange={(e) => setF({ ...f, start: e.target.value })} /></div>
      </div>
      <label className="small" style={{ display: 'flex', gap: 10, alignItems: 'center', cursor: 'pointer', marginTop: 8 }}><input type="checkbox" checked={f.retire} onChange={(e) => setF({ ...f, retire: e.target.checked })} />Remove scalp massage and rosemary oil</label>
      <label className="small" style={{ display: 'flex', gap: 10, alignItems: 'center', cursor: 'pointer', marginTop: 8 }}><input type="checkbox" checked={f.pso} onChange={(e) => setF({ ...f, pso: e.target.checked })} />Keep pumpkin seed oil on the checklist (untick in Routine settings when the bottle runs out)</label>
      <p className="tiny faint" style={{ marginTop: 6 }}>Starts with the oral dose once a day. The card will offer the evening dose after the first week.</p>
      <div className="btn-row" style={{ marginTop: 12, justifyContent: 'flex-end' }}><button className="btn primary" onClick={go}>Start treatment</button></div>
    </section>
  )
}

function Treatment({ hair, update, showToast }) {
  const t = hair.treatment
  const [editing, setEditing] = useState(false)
  const [f, setF] = useState(t)
  const habits = hair.habits || {}
  const twice = !!habits.oral_pm
  const stepUpDue = !twice && todayKey() >= addDays(t.start, 7)
  const save = () => { update((s) => ({ ...s, hair: { ...s.hair, treatment: { ...s.hair.treatment, ...f } } })); setEditing(false); showToast('Treatment updated') }
  const setPm = (on) => update((s) => ({ ...s, hair: setHairHabits(s.hair, { ...s.hair.habits, oral_pm: on }) }))
  const daysToFollowUp = t.followUp ? diffDays(todayKey(), t.followUp) : null
  return (
    <section className="card">
      <div className="card-head"><h2>Treatment</h2><button className="btn sm ghost" onClick={() => { setF(t); setEditing(!editing) }}>{editing ? 'Cancel' : 'Edit'}</button></div>
      {editing ? (
        <>
          <TreatmentFields f={f} setF={setF} />
          <div className="btn-row" style={{ justifyContent: 'flex-end' }}><button className="btn primary sm" onClick={save}>Save</button></div>
        </>
      ) : (
        <div>
          <div className="kv"><span className="k">{t.oralName}</span><span className="v">{t.oralDose}, {twice ? 'twice a day, about 12 hours apart' : 'once a day for the first week'}</span></div>
          <div className="kv"><span className="k">{t.topicalName}</span><span className="v">{t.topicalDose}, once a day on a dry scalp: hairline, top, crown</span></div>
          <div className="kv"><span className="k">Follow-up visit</span><span className="v">{t.followUp ? `${fmtDate(t.followUp)}${daysToFollowUp >= 0 ? `, in ${daysToFollowUp} days` : ''}` : 'Not set. Tap Edit to add the date.'}</span></div>
        </div>
      )}
      {stepUpDue && (
        <div className="note" style={{ marginTop: 12, borderColor: 'rgba(242,169,59,.5)' }}>
          <b>First week done.</b> <span className="muted">If you had no headaches, dizziness, pounding heartbeat or ankle swelling, add the evening dose. If anything felt off, stay on once a day and tell the clinic.</span>
          <div className="btn-row" style={{ marginTop: 10 }}><button className="btn sm primary" onClick={() => setPm(true)}>Add evening dose</button></div>
        </div>
      )}
      {twice && <div className="btn-row" style={{ marginTop: 10 }}><button className="btn sm ghost" onClick={() => { if (confirm('Go back to once a day? Only do this if the clinic said so or you had side effects.')) setPm(false) }}>Back to once a day</button></div>}
      <details style={{ marginTop: 14 }}>
        <summary className="small accent">How to apply the topical</summary>
        <div className="note" style={{ marginTop: 10, lineHeight: 1.6 }}>
          1. Scalp completely dry. Wet skin absorbs unevenly and makes it run.<br />
          2. Part the hair every 1 to 2 cm across the hairline and temples, the top, and the crown.<br />
          3. Drop it straight onto the scalp along each part, not onto the hair. About 6 to 10 parts uses one full dropper (about 1 mL). Skip the sides and back.<br />
          4. Spread lightly with one fingertip. No hard rubbing needed.<br />
          5. Wash your hands with soap straight away.<br />
          6. Let it dry 30 to 60 minutes before lying down, a hat or a towel.<br />
          7. Leave it on at least 4 hours before washing. Same time every day; if you miss a day, just carry on, never double up.<br />
          Keep it off your forehead and face: minoxidil grows hair wherever it lands.
        </div>
      </details>
      <details style={{ marginTop: 10 }}>
        <summary className="small accent">Side effects to watch</summary>
        <div className="note" style={{ marginTop: 10, lineHeight: 1.6 }}>
          <b>Expected:</b> more shedding in weeks 2 to 8; darker or extra hair on the arms, face or brows (fades if stopped).<br />
          <b>Tell the clinic:</b> headaches, lightheadedness when standing, a fast or pounding heartbeat, swelling in the ankles or face, a drop in sex drive or mood, or scalp itching and redness. Stay on the lower oral dose until they reply.<br />
          <b>Watch your weigh-ins:</b> minoxidil can hold water. A jump of more than about 1.5 to 2 kg in a few days without a diet change, especially with puffy ankles, is fluid, not fat. Call the clinic. A small rise in the first couple of weeks can also nudge the weight trend; don't read it as fat gain.<br />
          <b>Stop and get care now:</b> chest pain, or shortness of breath. Rare at these doses, but not something to wait on.<br />
          Note what happened and when it started, for the follow-up visit.
        </div>
      </details>
      <details style={{ marginTop: 10 }}>
        <summary className="small accent">Storage and safety</summary>
        <div className="note" style={{ marginTop: 10, lineHeight: 1.6 }}>
          Room temperature, cap tight, away from light and heat; a drawer beats a steamy bathroom. No fridge unless the label says so (minoxidil can crystallise in the cold). The solution is alcohol based, so it's flammable: keep it from flames and let it dry before a hair dryer. Finasteride must not reach a partner's skin, especially if she could be pregnant, so wash your hands after applying. Minoxidil is toxic to cats, even from a pillow. Follow the bottle's own label where it differs from this.
        </div>
      </details>
    </section>
  )
}

function Adherence({ state, targets }) {
  const hair = state.hair
  const weeks = useMemo(() => {
    const out = {}
    let d = hair.startDate
    const t = todayKey()
    while (d <= t) {
      const w = weekKey(d); out[w] ||= { week: w, active: {}, hits: {} }
      const habits = hairHabitsAt(hair, d)
      const log = hair.log?.[d] || {}
      const daily = state.daily?.[d] || {}
      Object.keys(HAIR_HABITS).filter((k) => habits[k]).forEach((k) => {
        out[w].active[k] = (out[w].active[k] || 0) + 1
        const hit = k === 'protein' && targets && daily.protein ? +daily.protein >= targets.protein : !!log[k]
        if (hit) out[w].hits[k] = (out[w].hits[k] || 0) + 1
      })
      d = addDays(d, 1)
    }
    return Object.values(out).sort((a, b) => (a.week < b.week ? 1 : -1)).slice(0, 4)
  }, [hair, state.daily, targets])
  if (!weeks.length) return null
  const cols = Object.keys(HAIR_HABITS).filter((k) => weeks.some((w) => w.active[k]))
  const cls = (k, hits, days) => {
    if (days < 3) return ''
    const per = HAIR_HABITS[k].per
    const goal = Math.max(1, Math.round((per * days) / 7) - (per === 7 ? 1 : 0))
    return hits >= goal ? 'teal' : hits >= goal * 0.6 ? '' : 'rose'
  }
  return (
    <section className="card">
      <div className="card-head"><h2>Weekly adherence</h2><span className="tiny faint">goal 6 of 7 days</span></div>
      <table className="compact">
        <thead><tr><th>Week of</th>{weeks.map((w, i) => <th key={w.week} className="num">{i === 0 ? 'This' : fmtDate(w.week, { month: 'numeric', day: 'numeric' })}</th>)}</tr></thead>
        <tbody>{cols.map((k) => (
          <tr key={k}><td className="small">{HAIR_HABITS[k].short}</td>{weeks.map((w) => {
            const days = w.active[k] || 0, hits = w.hits[k] || 0
            return <td key={w.week} className={'num ' + (days ? cls(k, hits, days) : 'faint')}>{days ? `${hits}/${days}` : '-'}</td>
          })}</tr>
        ))}</tbody>
      </table>
      <p className="tiny faint" style={{ marginTop: 8 }}>Days done out of days the habit was part of the routine, last 4 weeks. Missing doses is the main reason minoxidil fails, so the dose and topical rows are the ones that matter.</p>
    </section>
  )
}

// ---------- weekly shed count ----------
const SHED_CONTEXT = { wash: 'Regular wash', wash_oil: 'Wash after oil night', massage: 'Oil + massage only' }
const SHED_OFFERED = ['wash']
function Sheds({ state, update, showToast }) {
  const hair = state.hair
  const list = Object.entries(hair.sheds || {}).sort()
  const last = list[list.length - 1]?.[0]
  const due = !last || diffDays(last, todayKey()) >= 7
  const [f, setF] = useState({ date: todayKey(), count: '', context: 'wash', notes: '' })
  const save = () => {
    if (!(+f.count > 0)) return
    update((s) => ({ ...s, hair: { ...s.hair, sheds: { ...(s.hair.sheds || {}), [f.date]: { count: +f.count, context: f.context, notes: f.notes } } } }))
    setF({ ...f, count: '', notes: '' }); showToast('Shed count saved')
  }
  const data = list.map(([k, v]) => ({ date: fmtDate(k), count: v.count }))
  const baseline = list.length ? list[0][1].count : null
  const recent = list.slice(-3).map(([, v]) => v.count)
  const recentAvg = recent.length ? Math.round(recent.reduce((a, b) => a + b, 0) / recent.length) : null
  return (
    <section className="card">
      <div className="card-head"><h2>Weekly shed count</h2><span className={'chip ' + (due ? 'accent' : 'teal')}>{due ? 'due' : `next around ${fmtDate(addDays(last, 7))}`}</span></div>
      <p className="tiny faint">Once a week, same day and same wash. Collect the hair from the sink, drain and towel, spread it on white paper and count in groups of 10. Early on in treatment this is how you see the expected shedding rise and then settle.</p>
      <div className="grid grid-3" style={{ marginTop: 12 }}>
        <div className="field"><label>Date</label><input type="date" className="input" value={f.date} max={todayKey()} onChange={(e) => setF({ ...f, date: e.target.value })} /></div>
        <div className="field"><label>Hairs counted</label><input className="input mono" type="number" inputMode="numeric" placeholder="e.g. 80" value={f.count} onChange={(e) => setF({ ...f, count: e.target.value })} /></div>
        <div className="field"><label>Routine</label><select className="input" value={f.context} onChange={(e) => setF({ ...f, context: e.target.value })}>{SHED_OFFERED.map((k) => <option key={k} value={k}>{SHED_CONTEXT[k]}</option>)}</select></div>
        <div className="field" style={{ gridColumn: '1 / -1' }}><label>Notes (sick, stressed, new product, mostly thin or thick hairs)</label><input className="input" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></div>
      </div>
      <div className="btn-row" style={{ marginTop: 12, justifyContent: 'flex-end' }}><button className="btn primary sm" disabled={!(+f.count > 0)} onClick={save}>Save count</button></div>
      {list.length > 0 && (
        <>
          <div className="stat-row" style={{ marginTop: 14 }}>
            <div><div className="eyebrow">Baseline</div><div className="stat">{baseline}</div></div>
            <div><div className="eyebrow">Last 3 avg</div><div className={'stat ' + (baseline && recentAvg < baseline * 0.8 ? 'teal' : baseline && recentAvg > baseline * 1.3 ? 'rose' : '')}>{recentAvg}</div></div>
            <div><div className="eyebrow">Counts</div><div className="stat">{list.length}</div></div>
          </div>
          {data.length > 1 && (
            <div style={{ height: 180, marginTop: 10 }}>
              <ResponsiveContainer>
                <LineChart data={data} margin={{ top: 8, right: 8, left: -14, bottom: 0 }}>
                  <CartesianGrid stroke="#262C38" vertical={false} />
                  <XAxis dataKey="date" stroke="#7B8494" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#7B8494" fontSize={11} tickLine={false} axisLine={false} domain={[0, 'auto']} />
                  <Tooltip contentStyle={{ background: '#1C212C', border: '1px solid #343B4A', borderRadius: 9, fontSize: 12 }} labelStyle={{ color: '#B8BFCC' }} itemStyle={{ color: '#fff' }} />
                  <ReferenceLine y={100} stroke="#5FB3A1" strokeDasharray="4 4" label={{ value: '100', fill: '#5FB3A1', fontSize: 11, position: 'right' }} />
                  <Line type="monotone" dataKey="count" stroke="#F2A93B" strokeWidth={2.5} dot={{ r: 4, fill: '#F2A93B', strokeWidth: 0 }} isAnimationActive={false} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
          <div style={{ overflowX: 'auto', marginTop: 10 }}>
            <table>
              <thead><tr><th>Date</th><th className="num">Count</th><th>Routine</th><th>Notes</th></tr></thead>
              <tbody>{[...list].reverse().slice(0, 8).map(([k, v]) => <tr key={k}><td>{fmtDate(k)}</td><td className="num">{v.count}</td><td className="small">{SHED_CONTEXT[v.context] || v.context}</td><td className="small muted">{v.notes}</td></tr>)}</tbody>
            </table>
          </div>
        </>
      )}
      <p className="tiny faint" style={{ marginTop: 10 }}>Losing 50 to 100 hairs a day is normal, and a wash releases a day or more of them at once. On minoxidil, expect counts to rise in weeks 2 to 8, then settle. Tell the clinic if counts stay well above your baseline past week 12, or hair comes out in patches.</p>
    </section>
  )
}

function Checkins({ state, update, showToast }) {
  const hair = state.hair
  const [f, setF] = useState({ photos: false, crown: '3', front: '3', shedding: 'same', notes: '' })
  const list = Object.entries(hair.checkins || {}).sort().reverse()
  const last = list[0]?.[0]
  const due = !last || diffDays(last, todayKey()) >= 28
  const save = () => {
    update((s) => ({ ...s, hair: { ...s.hair, checkins: { ...s.hair.checkins, [todayKey()]: { ...f, crown: +f.crown, front: +f.front } } } }))
    showToast('Check-in saved')
  }
  return (
    <section className="card">
      <div className="card-head"><h2>Monthly check-in</h2><span className={'chip ' + (due ? 'accent' : 'teal')}>{due ? 'due' : `next around ${fmtDate(addDays(last, 28))}`}</span></div>
      <p className="tiny faint">Same four photos as baseline, dry hair, same light and phone height. Then rate honestly; the photos are the real record, the ratings just make the trend readable.</p>
      <div className="grid grid-3" style={{ marginTop: 12 }}>
        <label className="note" style={{ display: 'flex', gap: 10, alignItems: 'center', cursor: 'pointer' }}><input type="checkbox" checked={f.photos} onChange={(e) => setF({ ...f, photos: e.target.checked })} />Photos taken and saved</label>
        <div className="field"><label>Crown coverage (1 thin to 5 full)</label><select className="input" value={f.crown} onChange={(e) => setF({ ...f, crown: e.target.value })}>{[1, 2, 3, 4, 5].map((n) => <option key={n}>{n}</option>)}</select></div>
        <div className="field"><label>Hairline (1 to 5)</label><select className="input" value={f.front} onChange={(e) => setF({ ...f, front: e.target.value })}>{[1, 2, 3, 4, 5].map((n) => <option key={n}>{n}</option>)}</select></div>
        <div className="field"><label>Shedding vs last month</label><select className="input" value={f.shedding} onChange={(e) => setF({ ...f, shedding: e.target.value })}><option value="less">Less</option><option value="same">Same</option><option value="more">More</option></select></div>
        <div className="field" style={{ gridColumn: 'span 2' }}><label>Notes (side effects, new hairs, scalp irritation, labs)</label><input className="input" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></div>
      </div>
      <div className="btn-row" style={{ marginTop: 12, justifyContent: 'flex-end' }}><button className="btn primary sm" onClick={save}>Save check-in</button></div>
      {list.length > 0 && (
        <div style={{ marginTop: 14, overflowX: 'auto' }}>
          <table>
            <thead><tr><th>Date</th><th className="num">Crown</th><th className="num">Hairline</th><th>Shedding</th><th>Photos</th><th>Notes</th></tr></thead>
            <tbody>{list.map(([k, v]) => <tr key={k}><td>{fmtDate(k)}</td><td className="num">{v.crown}</td><td className="num">{v.front}</td><td>{v.shedding}</td><td>{v.photos ? 'yes' : '-'}</td><td className="small muted">{v.notes}</td></tr>)}</tbody>
          </table>
        </div>
      )}
    </section>
  )
}

function Evidence() {
  return (
    <section className="card">
      <div className="card-head"><h2>What the evidence says</h2></div>
      <details open>
        <summary className="small accent">The honest baseline</summary>
        <div className="note" style={{ marginTop: 10, lineHeight: 1.6 }}>
          Crown and top thinning with thick sides and back is <b>androgenetic (pattern) hair loss</b>, driven by genetics and the hormone DHT, not by anything you did. It progresses without treatment. Minoxidil and finasteride are the two treatments with strong evidence, and they work in different ways: <b>finasteride</b> lowers DHT, which slows or stops the loss itself; <b>minoxidil</b> lengthens the growth phase and thickens existing hairs. Together they beat either alone. The crown responds best, and starting while the hair there is thinned rather than gone gives the best odds. Results take 6 to 12 months and only last while you keep using them. Diet and sleep don't treat pattern loss, but deficiencies add shedding on top of it, so they still matter.
        </div>
      </details>
      <details style={{ marginTop: 10 }}>
        <summary className="small accent">Treatment, with sources</summary>
        <div className="note" style={{ marginTop: 10, lineHeight: 1.6 }}>
          <p style={{ marginBottom: 8 }}><b>Oral vs topical minoxidil.</b> Penha et al., JAMA Dermatology 2024: 90 men, 5 mg oral vs 5% topical twice daily for 24 weeks. No significant difference in hair density; oral was slightly ahead at the crown. Low oral doses (about 1.25 to 5 mg) are now widely used because a pill is easier to stick to. Main side effects: extra body hair, fluid retention, lightheadedness.</p>
          <p style={{ marginBottom: 8 }}><b>Topical finasteride.</b> Piraccini et al., JEADV 2022: 458 men, 0.25% spray for 24 weeks. It beat placebo on hair count and performed close to oral 1 mg, with far lower levels of the drug in the blood, which is why sexual side effects are less likely than with the pill. A 0.1% solution at 1 mL a day delivers about 1 mg of finasteride to the scalp.</p>
          <p style={{ marginBottom: 8 }}><b>Oral finasteride, for reference.</b> Kaufman et al., JAAD 1998: 1,553 men for 2 years. 83% had no further loss vs 28% on placebo, and 66% improved on photos vs 7%. Sexual side effects ran about 2 to 4% vs 1 to 2% on placebo, mostly reversible.</p>
          <p><b>Why both.</b> Minoxidil grows hair but leaves the DHT process running; finasteride stops the process but regrows less on its own. That's why combined treatment is the standard when tolerated.</p>
        </div>
      </details>
      <details style={{ marginTop: 10 }}>
        <summary className="small accent">Earlier natural routine (retired)</summary>
        <div className="note" style={{ marginTop: 10, lineHeight: 1.6 }}>
          <p style={{ marginBottom: 8 }}><b>Rosemary oil.</b> Panahi et al., SKINmed 2015: 100 men, rosemary oil vs minoxidil 2% for 6 months, similar hair counts. One study against the weaker 2% minoxidil; promising, not proven.</p>
          <p style={{ marginBottom: 8 }}><b>Pumpkin seed oil.</b> Cho et al., 2014: 76 men, 400 mg/day for 24 weeks, hair count up 40% vs 10% on placebo. Thought to work by lowering DHT, which finasteride does far more strongly.</p>
          <p><b>Scalp massage.</b> Koyama et al., ePlasty 2016: 9 men, 4 minutes daily for 24 weeks, slightly thicker hairs. Small study.</p>
        </div>
      </details>
      <details style={{ marginTop: 10 }}>
        <summary className="small accent">Diet for a vegetarian in a deficit</summary>
        <div className="note" style={{ marginTop: 10, lineHeight: 1.6 }}>
          Food can't treat pattern loss, but it can remove deficiencies that add shedding, which are more likely on a vegetarian diet during a cut:<br />
          <b>Protein</b>: keep hitting your target; paneer, Greek yogurt, lentils, chickpeas, tofu, soy chunks, whey.<br />
          <b>Iron</b> (plant iron absorbs poorly): lentils, chickpeas, tofu, spinach, pumpkin seeds, fortified cereal, always with vitamin C (lemon, tomato, capsicum) and not with tea or coffee in the same hour. Ferritin is the test that matters for hair.<br />
          <b>Zinc</b>: pumpkin seeds, chickpeas, cashews, oats, dairy.<br />
          <b>Vitamin D</b>: supplement only if a test shows you're low. A high-normal level needs no more, and most multivitamins and many omega-3 products add 1,000 IU or more.<br />
          <b>B12</b>: dairy covers some; vegetarians tend to drift down over time, so recheck yearly.<br />
          <b>Omega-3</b>: flaxseed, chia, walnuts, or an algae oil (same EPA and DHA as fish oil, usually less per capsule).<br />
          <b>Avoid</b>: biotin supplements (only help if deficient, and they distort blood tests including thyroid and some iron tests), high-dose vitamin A, and crash dieting.
        </div>
      </details>
    </section>
  )
}

function Settings({ state, update }) {
  const hair = state.hair
  const shown = Object.keys(HAIR_HABITS).filter((k) => !HAIR_HABITS[k].retired || hair.habits?.[k])
  const toggleHabit = (k) => update((s) => ({ ...s, hair: setHairHabits(s.hair, { ...s.hair.habits, [k]: !s.hair.habits?.[k] }) }))
  return (
    <section className="card">
      <div className="card-head"><h2>Routine settings</h2></div>
      <div className="grid">
        {shown.map((k) => (
          <label key={k} style={{ display: 'flex', gap: 10, alignItems: 'center', cursor: 'pointer' }} className="small"><input type="checkbox" checked={!!hair.habits?.[k]} onChange={() => toggleHabit(k)} />{habitLabel(k, hair)}{HAIR_HABITS[k].retired && <span className="tiny faint"> (retired)</span>}</label>
        ))}
      </div>
      <p className="tiny faint" style={{ marginTop: 8 }}>Changes apply from today. Earlier days keep the habits they were done under, so past streaks don't change.</p>
      <div className="divider" />
      <label style={{ display: 'flex', gap: 10, alignItems: 'center', cursor: 'pointer' }} className="small"><input type="checkbox" checked={!!hair.inStreak} onChange={() => update((s) => ({ ...s, hair: { ...s.hair, inStreak: !s.hair.inStreak } }))} />Count the hair routine as a target on the Streak calendar (all enabled habits done = hit)</label>
      <div className="btn-row" style={{ marginTop: 12 }}>
        <button className="btn sm ghost danger" onClick={() => { if (confirm('Stop the hair routine? Logs are kept.')) update((s) => ({ ...s, hair: { ...s.hair, startDate: null } })) }}>Stop routine</button>
      </div>
    </section>
  )
}

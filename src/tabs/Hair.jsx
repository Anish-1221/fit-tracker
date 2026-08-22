import { useMemo, useState } from 'react'
import { todayKey, addDays, fmtDate, diffDays, weekKey } from '../lib/calc'

// Every habit here has at least one human trial behind it or corrects a
// known cause of shedding. Frequencies follow the trial protocols.
export const HAIR_HABITS = {
  massage: { label: 'Scalp massage, 4 to 5 min', per: 7, how: 'Fingertips, firm circular pressure over crown and front, no nails. Koyama 2016: daily for 24 weeks increased hair thickness.' },
  rosemary: { label: 'Rosemary oil on the scalp', per: 7, how: '3 to 5 drops rosemary essential oil in 1 tsp carrier (coconut, jojoba or almond), massaged into thinning areas in the evening, washed out in the morning. Panahi 2015: matched minoxidil 2% at 6 months. Patch test on the inner arm first.' },
  pso: { label: 'Pumpkin seed oil or seeds with food', per: 7, how: '1 tsp cold-pressed pumpkin seed oil or a small handful (about 30 g) of pumpkin seeds. Cho 2014: 400 mg/day oral for 24 weeks, 40% more hair than placebo. Counts toward your fat and protein.' },
  protein: { label: 'Hit protein target', per: 7, how: 'Hair is keratin; under-eating protein in a deficit is a common cause of diffuse shedding. Your protein target already covers this; this just ties it to the routine.' },
  sleep: { label: '7 or more hours sleep', per: 7, how: 'Poor sleep and stress push follicles into the shedding phase. Tracked because it is the easiest lever to lose on a PhD schedule.' },
  gentle: { label: 'Gentle handling', per: 7, how: 'Lukewarm water, no rough towel drying, no tight caps for hours, wide comb, no heat styling. Prevents breakage that looks like thinning.' },
}

const CHECKPOINTS = [
  { week: 0, title: 'Baseline', text: 'Take four photos in the same bathroom light: hairline straight on, top down, crown from behind, and your part. Dry hair, phone at the same height. Save them in a dated album. Book a dermatologist visit and ask for ferritin, vitamin D, zinc, B12 and TSH; as a vegetarian in a deficit, iron, zinc and B12 are the ones most likely to be low.' },
  { week: 4, title: 'Settle in', text: 'Shedding can briefly rise in the first 4 to 8 weeks as follicles cycle. This is expected, not failure. Judge nothing yet; aim for 6 of 7 days on every habit.' },
  { week: 12, title: 'First checkpoint', text: 'Retake the four photos. Neither trial showed a hair-count change at 3 months, so look only for less shedding and any fine new hairs at the hairline. Correct any deficiency the labs found.' },
  { week: 24, title: 'Main checkpoint', text: 'Six months is where both rosemary and pumpkin seed oil showed results. Compare photos side by side. Visible improvement or stable: continue. Clearly worse: the natural options have had a fair trial; talk to the dermatologist about microneedling, low-level laser therapy, or medication, all of which have stronger evidence.' },
  { week: 52, title: 'One year', text: 'Full evaluation. Pattern hair loss is lifelong, so whatever is working has to continue. Keep the routine, keep quarterly photos, and re-check labs yearly.' },
]

export default function Hair({ state, update, showToast, targets }) {
  const hair = state.hair
  if (!hair?.startDate) return <Start update={update} />
  return (
    <>
      <Timeline hair={hair} />
      <Daily state={state} update={update} targets={targets} />
      <Adherence state={state} targets={targets} />
      <Checkins state={state} update={update} showToast={showToast} />
      <Evidence />
      <Settings state={state} update={update} />
    </>
  )
}

function Start({ update }) {
  const [start, setStart] = useState(todayKey())
  const [on, setOn] = useState(Object.fromEntries(Object.keys(HAIR_HABITS).map((k) => [k, true])))
  return (
    <section className="card">
      <div className="eyebrow">Hair routine</div>
      <h1 style={{ margin: '6px 0 10px' }}>Set up your routine</h1>
      <p className="muted small">A daily checklist built from the natural options with human trial evidence, a timeline with checkpoints so you know when to judge it, and monthly photo check-ins. Pick the habits you will actually do; you can change them later.</p>
      <div className="grid" style={{ marginTop: 14 }}>
        {Object.entries(HAIR_HABITS).map(([k, h]) => (
          <label key={k} className="note" style={{ display: 'flex', gap: 12, alignItems: 'flex-start', cursor: 'pointer' }}>
            <input type="checkbox" checked={on[k]} onChange={(e) => setOn({ ...on, [k]: e.target.checked })} style={{ marginTop: 3 }} />
            <span><b>{h.label}</b><br /><span className="faint">{h.how}</span></span>
          </label>
        ))}
      </div>
      <div className="grid grid-2" style={{ marginTop: 14 }}>
        <div className="field"><label>Start date</label><input type="date" className="input" value={start} max={todayKey()} onChange={(e) => setStart(e.target.value)} /></div>
      </div>
      <div className="btn-row" style={{ marginTop: 14, justifyContent: 'flex-end' }}>
        <button className="btn primary" onClick={() => update((s) => ({ ...s, hair: { startDate: start, habits: on, inStreak: true, log: {}, checkins: {} } }))}>Start routine</button>
      </div>
    </section>
  )
}

function Timeline({ hair }) {
  const week = Math.floor(diffDays(hair.startDate, todayKey()) / 7)
  const nextIdx = CHECKPOINTS.findIndex((c) => c.week > week)
  const current = [...CHECKPOINTS].reverse().find((c) => c.week <= week) || CHECKPOINTS[0]
  const next = CHECKPOINTS[nextIdx]
  return (
    <section className="card">
      <div className="card-head"><h2>Week {week} of 52</h2><span className="chip">started {fmtDate(hair.startDate)}</span></div>
      <div style={{ display: 'flex', gap: 4, margin: '6px 0 14px' }}>
        {CHECKPOINTS.slice(0, -1).map((c, i) => {
          const span = CHECKPOINTS[i + 1].week - c.week
          const done = Math.min(Math.max(week - c.week, 0), span)
          return <div key={i} style={{ flex: span, height: 6, borderRadius: 3, background: 'var(--line-2)', overflow: 'hidden' }}><div style={{ width: (done / span) * 100 + '%', height: '100%', background: 'var(--accent)' }} /></div>
        })}
      </div>
      <div className="note"><b>{current.title} (week {current.week})</b><br /><span className="muted">{current.text}</span></div>
      {next && <p className="small faint" style={{ marginTop: 10 }}>Next checkpoint: <b className="muted">{next.title}</b> in week {next.week}, around {fmtDate(addDays(hair.startDate, next.week * 7))}.</p>}
    </section>
  )
}

function Daily({ state, update, targets }) {
  const [dateKey, setDateKey] = useState(todayKey())
  const hair = state.hair
  const log = hair.log?.[dateKey] || {}
  const daily = state.daily?.[dateKey] || {}
  const enabled = Object.keys(HAIR_HABITS).filter((k) => hair.habits?.[k])
  const toggle = (k) => update((s) => ({ ...s, hair: { ...s.hair, log: { ...s.hair.log, [dateKey]: { ...(s.hair.log?.[dateKey] || {}), [k]: !s.hair.log?.[dateKey]?.[k] } } } }))
  const proteinAuto = targets && daily.protein ? +daily.protein >= targets.protein : null
  const done = enabled.filter((k) => (k === 'protein' && proteinAuto != null ? proteinAuto : log[k])).length
  return (
    <section className="card">
      <div className="card-head"><h2>Today's routine</h2>
        <div className="btn-row" style={{ alignItems: 'center' }}>
          <button className="btn sm ghost" onClick={() => setDateKey(addDays(dateKey, -1))}>Prev</button>
          <input type="date" className="input" style={{ width: 'auto', minHeight: 34, padding: '4px 10px' }} value={dateKey} max={todayKey()} onChange={(e) => e.target.value && setDateKey(e.target.value)} />
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
              <span style={{ flex: 1 }}><b>{h.label}</b>{auto && <span className="tiny faint"> from nutrition log</span>}</span>
            </button>
          )
        })}
      </div>
      <p className="tiny faint" style={{ marginTop: 10 }}>{done} of {enabled.length} done. Tap a habit to read how to do it in the Evidence section below.</p>
    </section>
  )
}

function Adherence({ state, targets }) {
  const hair = state.hair
  const enabled = Object.keys(HAIR_HABITS).filter((k) => hair.habits?.[k])
  const weeks = useMemo(() => {
    const out = {}
    let d = hair.startDate
    const t = todayKey()
    while (d <= t) {
      const w = weekKey(d); out[w] ||= { week: w, days: 0, hits: Object.fromEntries(enabled.map((k) => [k, 0])) }
      out[w].days++
      const log = hair.log?.[d] || {}
      const daily = state.daily?.[d] || {}
      enabled.forEach((k) => { if (k === 'protein' && targets && daily.protein) { if (+daily.protein >= targets.protein) out[w].hits[k]++ } else if (log[k]) out[w].hits[k]++ })
      d = addDays(d, 1)
    }
    return Object.values(out).sort((a, b) => (a.week < b.week ? 1 : -1)).slice(0, 8)
  }, [hair, state.daily, enabled, targets])
  if (!weeks.length) return null
  return (
    <section className="card">
      <div className="card-head"><h2>Weekly adherence</h2><span className="tiny faint">target 6 of 7</span></div>
      <div style={{ overflowX: 'auto' }}>
        <table>
          <thead><tr><th>Week of</th>{enabled.map((k) => <th key={k} className="num">{HAIR_HABITS[k].label.split(',')[0].split(' ').slice(0, 2).join(' ')}</th>)}</tr></thead>
          <tbody>{weeks.map((w) => (
            <tr key={w.week}><td>{fmtDate(w.week)}</td>{enabled.map((k) => <td key={k} className={'num ' + (w.hits[k] >= 6 ? 'teal' : w.hits[k] >= 4 ? '' : 'rose')}>{w.hits[k]}/{w.days}</td>)}</tr>
          ))}</tbody>
        </table>
      </div>
      <p className="tiny faint" style={{ marginTop: 8 }}>Consistency matters more than any single ingredient: both trials ran 6 months of daily use. Fewer than 4 days a week is unlikely to show anything.</p>
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
        <div className="field" style={{ gridColumn: 'span 2' }}><label>Notes (labs, new hairs, scalp irritation)</label><input className="input" value={f.notes} onChange={(e) => setF({ ...f, notes: e.target.value })} /></div>
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
          Thinning at the crown with a receding front is the distribution of <b>androgenetic (pattern) hair loss</b>, which is driven by genetics and the hormone DHT, not by anything you did. It is progressive, so the realistic natural goal is to slow it, thicken what is there and regrow some at the edges, not to reverse it fully. The strongest evidence by far belongs to minoxidil, finasteride, microneedling and low-level laser devices; the last two are not chemicals and are worth asking a dermatologist about if the natural routine has not moved things by 6 months. A <b>dermatologist visit and a blood panel</b> are the first step regardless, because a deficiency (iron, zinc, vitamin D, B12, thyroid) adds diffuse shedding on top of the pattern and is fixable.
        </div>
      </details>
      <details style={{ marginTop: 10 }}>
        <summary className="small accent">The habits, with sources</summary>
        <div className="note" style={{ marginTop: 10, lineHeight: 1.6 }}>
          {Object.values(HAIR_HABITS).map((h) => <p key={h.label} style={{ marginBottom: 8 }}><b>{h.label}.</b> {h.how}</p>)}
          <p><b>Rosemary trial detail.</b> Panahi, Taghizadeh, Marzony and Sahebkar, SKINmed 2015: 100 men with pattern loss, rosemary oil vs minoxidil 2% for 6 months. Hair count rose in both groups with no difference between them, and no change in either at 3 months. One study, and the comparator was the weaker 2% minoxidil, so treat it as promising rather than proven.</p>
          <p><b>Pumpkin seed oil detail.</b> Cho et al., Evidence-Based Complementary and Alternative Medicine 2014: 76 men, 400 mg/day oral vs placebo for 24 weeks, hair count up 40% vs 10%. Included in the JAMA Dermatology 2023 systematic review of supplements as one of the better-supported options. The trial only reported crown results, so expect less at the front.</p>
          <p><b>Scalp massage detail.</b> Koyama et al., ePlasty 2016: 9 men, 4 minutes daily for 24 weeks, hair thickness rose from 0.085 to 0.092 mm. Small study; cheap and harmless, and it also spreads the oil.</p>
        </div>
      </details>
      <details style={{ marginTop: 10 }}>
        <summary className="small accent">Diet for a vegetarian in a deficit</summary>
        <div className="note" style={{ marginTop: 10, lineHeight: 1.6 }}>
          The JAMA 2023 review found no diet-based trials, so food cannot be sold as a treatment. What it can do is remove the deficiencies that cause shedding, which are more likely on a vegetarian diet during a cut:<br />
          <b>Protein</b>: keep hitting your target; paneer, Greek yogurt, lentils, chickpeas, tofu, soy chunks, whey if you use it.<br />
          <b>Iron</b> (plant iron absorbs poorly): lentils, chickpeas, spinach, pumpkin seeds, fortified cereal, always with vitamin C (lemon, tomato, capsicum) and not with tea or coffee in the same hour.<br />
          <b>Zinc</b>: pumpkin seeds, chickpeas, cashews, oats, dairy. The review rated zinc supplementation as reasonably supported, but only supplement if labs show you are low.<br />
          <b>Vitamin D</b>: sun exposure and fortified milk; most people need a supplement in winter, check the level first.<br />
          <b>B12</b>: dairy covers some; vegetarians are often low, labs will tell you.<br />
          <b>Omega-3</b>: flaxseed, chia, walnuts.<br />
          <b>Avoid</b>: megadose biotin (only helps if deficient and it corrupts thyroid test results), high-dose vitamin A, and crash dieting. Your deficit is capped at 25% of maintenance in this site for exactly this reason; do not push below it.
        </div>
      </details>
    </section>
  )
}

function Settings({ state, update }) {
  const hair = state.hair
  const toggleHabit = (k) => update((s) => ({ ...s, hair: { ...s.hair, habits: { ...s.hair.habits, [k]: !s.hair.habits?.[k] } } }))
  return (
    <section className="card">
      <div className="card-head"><h2>Routine settings</h2></div>
      <div className="grid">
        {Object.entries(HAIR_HABITS).map(([k, h]) => (
          <label key={k} style={{ display: 'flex', gap: 10, alignItems: 'center', cursor: 'pointer' }} className="small"><input type="checkbox" checked={!!hair.habits?.[k]} onChange={() => toggleHabit(k)} />{h.label}</label>
        ))}
      </div>
      <div className="divider" />
      <label style={{ display: 'flex', gap: 10, alignItems: 'center', cursor: 'pointer' }} className="small"><input type="checkbox" checked={!!hair.inStreak} onChange={() => update((s) => ({ ...s, hair: { ...s.hair, inStreak: !s.hair.inStreak } }))} />Count the hair routine as a target on the Streak calendar (all enabled habits done = hit)</label>
      <div className="btn-row" style={{ marginTop: 12 }}>
        <button className="btn sm ghost danger" onClick={() => { if (confirm('Stop the hair routine? Logs are kept.')) update((s) => ({ ...s, hair: { ...s.hair, startDate: null } })) }}>Stop routine</button>
      </div>
    </section>
  )
}

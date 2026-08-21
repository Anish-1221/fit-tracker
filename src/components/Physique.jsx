import { useMemo, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, Legend } from 'recharts'
import { MUSCLE_GROUPS, PHYSIQUE_SITES, BONE_SITES, FOCUS, DAYS } from '../data/program'
import { analyzePhysique, groupValue, todayKey, weekKey, fmtDate, FOCUS_MIN_WEEKS, FOCUS_MIN_READINGS, TAPE_NOISE } from '../lib/calc'

const COLORS = ['#F2A93B', '#5FB3A1', '#E06C75', '#8FA3FF', '#C9A0DC', '#FFC46B', '#7FD1C5']

export default function Physique({ state, update, showToast }) {
  const enabled = !!state.profile?.physique
  if (!enabled) return <Intro state={state} update={update} />
  return (
    <>
      <Entry state={state} update={update} showToast={showToast} />
      <Analysis state={state} update={update} showToast={showToast} />
      <History state={state} />
    </>
  )
}

function Intro({ state, update }) {
  const [b, setB] = useState({ wrist: state.profile?.bones?.wrist || '', ankle: state.profile?.bones?.ankle || '', knee: state.profile?.bones?.knee || '' })
  const ok = +b.wrist > 0 && +b.ankle > 0 && +b.knee > 0
  return (
    <section className="card">
      <div className="card-head"><h2>Physique tracking</h2><span className="chip">optional</span></div>
      <p className="muted small">Track muscle girths and the site tells you which group is falling behind, then offers a small focus block (one extra exercise, 2 to 3 sets) on the day that already trains it. Start with three bone measurements: they don't change with training and set your personal reference proportions.</p>
      <div className="grid grid-3" style={{ marginTop: 14 }}>
        {Object.entries(BONE_SITES).map(([k, label]) => (
          <div className="field" key={k}><label>{label} (cm)</label><input className="input mono" type="number" step="0.1" value={b[k]} onChange={(e) => setB({ ...b, [k]: e.target.value })} /></div>
        ))}
      </div>
      <div className="btn-row" style={{ marginTop: 14, justifyContent: 'flex-end' }}>
        <button className="btn primary" disabled={!ok} onClick={() => update((s) => ({ ...s, profile: { ...s.profile, physique: true, bones: { wrist: +b.wrist, ankle: +b.ankle, knee: +b.knee } } }))}>Start tracking</button>
      </div>
    </section>
  )
}

function Entry({ state, update, showToast }) {
  const wk = weekKey(todayKey())
  const existing = Object.keys(state.measurements || {}).filter((k) => weekKey(k) === wk).sort().pop()
  const m = existing ? state.measurements[existing] : {}
  const [f, setF] = useState(() => Object.fromEntries(Object.keys(PHYSIQUE_SITES).map((k) => [k, m.physique?.[k] || ''])))
  const filled = Object.values(f).filter((v) => +v > 0).length
  const save = () => {
    const key = existing || todayKey()
    const physique = Object.fromEntries(Object.entries(f).filter(([, v]) => +v > 0).map(([k, v]) => [k, +v]))
    update((s) => ({ ...s, measurements: { ...s.measurements, [key]: { ...(s.measurements?.[key] || {}), physique } } }))
    showToast('Physique measurements saved')
  }
  return (
    <section className="card">
      <div className="card-head"><h2>Muscle measurements</h2><span className={'chip ' + (m.physique ? 'teal' : '')}>{m.physique ? 'done this week' : 'weekly, same day as body fat'}</span></div>
      <p className="tiny faint">Same conditions every time: morning, before food, relaxed unless the site says flexed, tape flat and snug but not compressing. Fill only the sites you want to track; both sides is best, it catches imbalances.</p>
      <div className="grid grid-2" style={{ marginTop: 12 }}>
        {Object.entries(PHYSIQUE_SITES).map(([k, label]) => (
          <div className="field" key={k}><label>{label}</label><input className="input mono" type="number" step="0.1" placeholder="cm" value={f[k]} onChange={(e) => setF({ ...f, [k]: e.target.value })} /></div>
        ))}
      </div>
      <div className="btn-row" style={{ marginTop: 12, justifyContent: 'flex-end' }}>
        <button className="btn primary sm" disabled={!filled} onClick={save}>Save {filled ? `(${filled} sites)` : ''}</button>
      </div>
    </section>
  )
}

function Analysis({ state, update, showToast }) {
  const a = useMemo(() => analyzePhysique(state, MUSCLE_GROUPS), [state])
  const focusActive = state.prefs?.focus || {} // { group: { since, exercises:[ids] } }
  const toggleFocus = (g) => {
    update((s) => {
      const f = { ...(s.prefs?.focus || {}) }
      if (f[g]) delete f[g]
      else f[g] = { since: todayKey(), exercises: FOCUS[g].map((x) => x.id) }
      return { ...s, prefs: { ...s.prefs, focus: f } }
    })
    showToast(focusActive[g] ? 'Focus block removed' : 'Focus block added to your sessions')
  }
  if (!a) return (
    <section className="card"><div className="eyebrow">Proportions</div><p className="muted small" style={{ marginTop: 6 }}>Save your first set of muscle measurements and this card compares each group to your reference proportions.</p></section>
  )
  const KIND = { lagging: ['rose', 'behind the rest'], stalled: ['accent', 'not growing'], asymmetry: ['', 'left/right gap'] }
  return (
    <section className="card">
      <div className="card-head"><h2>Proportions</h2><span className="chip">latest: {fmtDate(a.latest.date)}</span></div>
      <table>
        <thead><tr><th>Group</th><th className="num">Now</th><th className="num">Reference</th><th className="num">%</th><th className="num">{FOCUS_MIN_WEEKS}wk change</th></tr></thead>
        <tbody>
          {a.rows.filter((r) => r.value != null).map((r) => (
            <tr key={r.group}>
              <td>{r.label}{focusActive[r.group] && <span className="chip teal" style={{ marginLeft: 6 }}>focus</span>}</td>
              <td className="num">{r.value.toFixed(1)}</td>
              <td className="num faint">{r.target ? r.target.toFixed(1) : '-'}</td>
              <td className={'num ' + (r.pct != null && a.median != null && a.median - r.pct >= 5 ? 'rose' : '')}>{r.pct != null ? r.pct.toFixed(0) : '-'}</td>
              <td className={'num ' + (r.change != null ? (r.change >= TAPE_NOISE ? 'teal' : r.change < TAPE_NOISE * 0.5 ? 'faint' : '') : 'faint')}>{r.change != null ? (r.change >= 0 ? '+' : '') + r.change.toFixed(1) : r.weeks ? `${r.weeks}/${FOCUS_MIN_WEEKS} wk` : 'need data'}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {a.flags.length > 0 ? (
        <div style={{ marginTop: 14 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>What stands out</div>
          {a.flags.map((f, i) => (
            <div key={i} className="small" style={{ padding: '6px 0', display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <span className={'chip ' + KIND[f.kind][0]}>{KIND[f.kind][1]}</span>
              <b>{MUSCLE_GROUPS[f.group].label}</b><span className="muted">{f.detail}</span>
            </div>
          ))}
        </div>
      ) : <p className="small muted" style={{ marginTop: 12 }}>Nothing out of proportion by more than the tape can detect. Keep measuring weekly; trend flags unlock after {FOCUS_MIN_WEEKS} weeks and {FOCUS_MIN_READINGS} readings.</p>}

      {a.focus.length > 0 && (
        <div style={{ marginTop: 14 }}>
          <div className="eyebrow" style={{ marginBottom: 8 }}>Suggested focus (max two at a time)</div>
          {a.focus.map((g) => (
            <div key={g} className="note" style={{ marginBottom: 8 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
                <div><b>{MUSCLE_GROUPS[g].label}</b> <span className="faint">about {MUSCLE_GROUPS[g].weeklySets} direct sets/week now, block adds {FOCUS[g].reduce((s, x) => s + x.sets, 0)}</span></div>
                <button className={'btn sm ' + (focusActive[g] ? '' : 'primary')} onClick={() => toggleFocus(g)}>{focusActive[g] ? 'Remove block' : 'Add focus block'}</button>
              </div>
              <ul style={{ margin: '8px 0 0', paddingLeft: 18 }}>
                {FOCUS[g].map((x) => <li key={x.id}>{x.name}, {x.sets} x {x.reps}, added to {DAYS[x.day].label}</li>)}
              </ul>
              {focusActive[g] && <div className="tiny faint" style={{ marginTop: 6 }}>Running since {fmtDate(focusActive[g].since)}. Re-check after {FOCUS_MIN_WEEKS} weeks; remove it if the group caught up, or swap which group gets the block.</div>}
            </div>
          ))}
        </div>
      )}

      {Object.keys(focusActive).filter((g) => !a.focus.includes(g)).map((g) => (
        <div key={g} className="note" style={{ marginTop: 8, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 10 }}>
          <span><b>{MUSCLE_GROUPS[g].label}</b> focus block is active but no longer flagged.</span>
          <button className="btn sm" onClick={() => toggleFocus(g)}>Remove block</button>
        </div>
      ))}

      <details style={{ marginTop: 14 }}>
        <summary className="small accent">How this decides</summary>
        <div className="note" style={{ marginTop: 10, lineHeight: 1.6 }}>
          <b>Reference proportions</b> come from Steve Reeves' classic ratios scaled to your bones: upper arm 2.52x wrist, calf 1.92x ankle, thigh 1.75x knee, neck about equal to arm; relaxed chest 6.5x wrist and forearm about 0.8x arm (McCallum); shoulders 1.618x waist. They are an aesthetic convention, so the site only uses them to rank groups against each other: a group is <b>behind</b> when it sits 5 or more points below your median percentage. <br />
          <b>Not growing</b> needs at least {FOCUS_MIN_WEEKS} weeks and {FOCUS_MIN_READINGS} readings, because a tape is only reliable to about {TAPE_NOISE} cm and real muscle growth takes 6 to 8 weeks to show (early changes are mostly fluid). It flags only when other groups gained at least {TAPE_NOISE} cm in the same window, which filters out the effect of fat loss shrinking everything at once. <br />
          <b>Left/right gap</b> over {TAPE_NOISE} cm is flagged but does not trigger a focus block: fix it by doing the single-arm or single-leg version and starting with the weaker side, matching its reps on the stronger side. <br />
          <b>The fix is volume.</b> Schoenfeld, Ogborn and Krieger (2017) found a graded dose-response: each extra weekly set adds about 0.37% growth, and 10+ weekly sets per muscle beat fewer than 5. A focus block adds one exercise of 2 to 3 sets to a day that already trains the group, lifting it toward that range without wrecking recovery. Two focus groups at most, because total volume is capped by recovery, especially in a deficit. Re-evaluate every {FOCUS_MIN_WEEKS} weeks. <br />
          <b>During a cut</b>, expect arm, thigh and chest numbers to dip even while muscle grows, since fat comes off those sites. Trust the percentages relative to each other and your waist trend more than any single girth.
        </div>
      </details>
    </section>
  )
}

function History({ state }) {
  const readings = useMemo(() => analyzePhysique(state, MUSCLE_GROUPS)?.readings || [], [state])
  const groups = Object.keys(MUSCLE_GROUPS).filter((g) => readings.some((r) => groupValue(r, g) != null))
  const [sel, setSel] = useState(() => groups.slice(0, 3))
  if (readings.length < 2) return null
  const data = readings.map((r) => ({ date: fmtDate(r.date), ...Object.fromEntries(groups.map((g) => [g, groupValue(r, g) != null ? +groupValue(r, g).toFixed(1) : null])) }))
  return (
    <section className="card">
      <div className="card-head"><h2>Girth history</h2></div>
      <div className="btn-row" style={{ marginBottom: 10 }}>
        {groups.map((g, i) => <button key={g} className={'chip' + (sel.includes(g) ? ' accent' : '')} style={sel.includes(g) ? { color: COLORS[i % COLORS.length], background: 'var(--surface-2)' } : {}} onClick={() => setSel(sel.includes(g) ? sel.filter((x) => x !== g) : [...sel, g])}>{MUSCLE_GROUPS[g].label}</button>)}
      </div>
      <div style={{ height: 240 }}>
        <ResponsiveContainer>
          <LineChart data={data} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
            <CartesianGrid stroke="#262C38" vertical={false} />
            <XAxis dataKey="date" stroke="#7B8494" fontSize={11} tickLine={false} axisLine={false} />
            <YAxis stroke="#7B8494" fontSize={11} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
            <Tooltip contentStyle={{ background: '#1C212C', border: '1px solid #343B4A', borderRadius: 9, fontSize: 12 }} labelStyle={{ color: '#B8BFCC' }} />
            <Legend wrapperStyle={{ fontSize: 12 }} formatter={(g) => MUSCLE_GROUPS[g].label} />
            {groups.map((g, i) => sel.includes(g) && <Line key={g} type="monotone" dataKey={g} stroke={COLORS[i % COLORS.length]} strokeWidth={2} dot={{ r: 3, strokeWidth: 0, fill: COLORS[i % COLORS.length] }} connectNulls isAnimationActive={false} />)}
          </LineChart>
        </ResponsiveContainer>
      </div>
    </section>
  )
}

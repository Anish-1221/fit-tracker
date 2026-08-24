import { useMemo, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, ReferenceLine } from 'recharts'
import { ACTIVITY, navyBodyFat, ftInToCm, todayKey, fmtDate, weeklyAverages, weekKey, addDays } from '../lib/calc'
import Physique from '../components/Physique'

const METRICS = {
  weight: { label: 'Weight (kg)', color: '#F2A93B' },
  calories: { label: 'Calories (kcal)', color: '#F2A93B' },
  protein: { label: 'Protein (g)', color: '#5FB3A1' },
  steps: { label: 'Steps', color: '#5FB3A1' },
  bodyfat: { label: 'Body fat (%)', color: '#F2A93B' },
}

export default function Nutrition({ state, update, targets, showToast }) {
  const [editing, setEditing] = useState(!state.profile)
  if (!state.profile || editing) return <ProfileForm state={state} update={update} onDone={() => setEditing(false)} />
  return (
    <>
      <Targets targets={targets} profile={state.profile} onEdit={() => setEditing(true)} />
      <DailyLog state={state} update={update} targets={targets} />
      <Measurements state={state} update={update} showToast={showToast} />
      <Trends state={state} targets={targets} />
      <Physique state={state} update={update} showToast={showToast} />
    </>
  )
}

// ---------- profile ----------
function ProfileForm({ state, update, onDone }) {
  const p = state.profile || {}
  const [f, setF] = useState({
    sex: p.sex || 'male', age: p.age || '', weightKg: p.weightKg || '',
    ft: p.ft || '', inch: p.inch ?? '', activity: p.activity || 'light',
    neckCm: p.neckCm || '', waistCm: p.waistCm || '', hipCm: p.hipCm || '',
    goalBodyFat: p.goalBodyFat || '', bodyFatOverride: p.bodyFatOverride || '', stepsOverride: p.stepsOverride || '',
  })
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const heightCm = ftInToCm(+f.ft || 0, +f.inch || 0)
  const navy = navyBodyFat({ sex: f.sex, heightCm, neckCm: +f.neckCm, waistCm: +f.waistCm, hipCm: +f.hipCm })
  const bf = f.bodyFatOverride ? +f.bodyFatOverride : navy
  const valid = +f.age > 0 && +f.weightKg > 0 && heightCm > 0 && bf != null && +f.goalBodyFat > 0

  const save = () => {
    update((s) => ({
      ...s,
      profile: { ...(s.profile || {}), ...f, age: +f.age, weightKg: +f.weightKg, ft: +f.ft, inch: +f.inch, heightCm, neckCm: +f.neckCm, waistCm: +f.waistCm, hipCm: +f.hipCm, goalBodyFat: +f.goalBodyFat, bodyFat: +bf.toFixed(1), updated: todayKey() },
      measurements: { ...s.measurements, [todayKey()]: { ...(s.measurements?.[todayKey()] || {}), neck: +f.neckCm, waist: +f.waistCm, hip: +f.hipCm || undefined, bodyfat: +bf.toFixed(1), weight: +f.weightKg } },
    }))
    onDone()
  }
  return (
    <section className="card">
      <div className="eyebrow">Your numbers</div>
      <h1 style={{ margin: '6px 0 8px' }}>{state.profile ? 'Update profile' : 'Set up your targets'}</h1>
      <p className="muted small">Body fat is estimated with the US Navy tape method from your neck and waist, which is the most accurate option without a scan. Measure the waist at the navel, relaxed, and the neck just below the larynx.</p>
      <div className="grid grid-3" style={{ marginTop: 16 }}>
        <div className="field"><label>Sex</label><select className="input" value={f.sex} onChange={set('sex')}><option value="male">Male</option><option value="female">Female</option></select></div>
        <div className="field"><label>Age</label><input className="input mono" type="number" value={f.age} onChange={set('age')} /></div>
        <div className="field"><label>Weight (kg)</label><input className="input mono" type="number" step="0.1" value={f.weightKg} onChange={set('weightKg')} /></div>
        <div className="field"><label>Height</label><div className="input-row"><input className="input mono" type="number" placeholder="ft" value={f.ft} onChange={set('ft')} /><span className="unit">ft</span><input className="input mono" type="number" placeholder="in" value={f.inch} onChange={set('inch')} /><span className="unit">in</span></div></div>
        <div className="field" style={{ gridColumn: 'span 2' }}><label>Activity outside the gym</label><select className="input" value={f.activity} onChange={set('activity')}>{ACTIVITY.map((a) => <option key={a.key} value={a.key}>{a.label}</option>)}</select></div>
        <div className="field"><label>Neck (cm)</label><input className="input mono" type="number" step="0.1" value={f.neckCm} onChange={set('neckCm')} /></div>
        <div className="field"><label>Waist at navel (cm)</label><input className="input mono" type="number" step="0.1" value={f.waistCm} onChange={set('waistCm')} /></div>
        <div className="field"><label>Hip (cm){f.sex === 'male' && <span className="faint"> optional</span>}</label><input className="input mono" type="number" step="0.1" value={f.hipCm} onChange={set('hipCm')} /></div>
        <div className="field"><label>Estimated body fat</label><div className="input mono" style={{ display: 'flex', alignItems: 'center' }}>{navy != null ? navy.toFixed(1) + ' %' : <span className="faint">needs neck, waist, height</span>}</div></div>
        <div className="field"><label>Override body fat (%)<span className="faint"> if you know it</span></label><input className="input mono" type="number" step="0.1" value={f.bodyFatOverride} onChange={set('bodyFatOverride')} /></div>
        <div className="field"><label>Goal body fat (%)</label><input className="input mono" type="number" step="0.5" placeholder="e.g. 15" value={f.goalBodyFat} onChange={set('goalBodyFat')} /></div>
        <div className="field"><label>Step goal override<span className="faint"> blank = automatic</span></label><input className="input mono" type="number" step="500" placeholder="auto" value={f.stepsOverride} onChange={set('stepsOverride')} /></div>
      </div>
      <div className="note" style={{ marginTop: 14 }}>For men, 10 to 15% is a lean athletic look with visible abs; 15 to 18% is fit and sustainable. Going below 10% is not a healthy long-term target. For women add roughly 8 to 10 points to those ranges.</div>
      <div className="btn-row" style={{ marginTop: 16, justifyContent: 'flex-end' }}>
        {state.profile && <button className="btn ghost" onClick={onDone}>Cancel</button>}
        <button className="btn primary" disabled={!valid} onClick={save}>Save and calculate</button>
      </div>
    </section>
  )
}

// ---------- targets ----------
function Targets({ targets: t, profile, onEdit }) {
  if (!t) return null
  return (
    <section className="card">
      <div className="card-head"><h2>Daily targets</h2><button className="btn sm ghost" onClick={onEdit}>Edit profile</button></div>
      <div className="stat-row">
        <div><div className="eyebrow">Calories</div><div className="stat accent">{t.calories}<small>kcal</small></div></div>
        <div><div className="eyebrow">Protein</div><div className="stat teal">{t.protein}<small>g</small></div></div>
        <div><div className="eyebrow">Carbs</div><div className="stat">{t.carbs}<small>g</small></div></div>
        <div><div className="eyebrow">Fat</div><div className="stat">{t.fat}<small>g</small></div></div>
        <div><div className="eyebrow">Steps</div><div className="stat">{(t.steps / 1000).toFixed(0)}k<small>/ {(t.absDaySteps / 1000).toFixed(0)}k abs day</small></div></div>
      </div>
      <div className="divider" />
      <div className="stat-row">
        <div><div className="eyebrow">Body fat now</div><div className="stat">{t.bfNow?.toFixed(1)}<small>%</small></div></div>
        <div><div className="eyebrow">Goal</div><div className="stat">{t.goalBf}<small>%</small></div></div>
        <div><div className="eyebrow">Goal weight</div><div className="stat">{t.goalWeight?.toFixed(1)}<small>kg</small></div></div>
        <div><div className="eyebrow">Pace</div><div className="stat">{(t.rate * 100).toFixed(2)}<small>% / wk</small></div></div>
        <div><div className="eyebrow">Time to goal</div><div className="stat">{t.weeksToGoal ?? '-'}<small>weeks</small></div></div>
      </div>
      <details style={{ marginTop: 14 }}>
        <summary className="small accent">How these are calculated</summary>
        <div className="note" style={{ marginTop: 10, lineHeight: 1.6 }}>
          <b>Resting energy (BMR) {t.BMR} kcal</b>: Mifflin-St Jeor equation, the most accurate of the common formulas in validation studies. <br />
          <b>Maintenance {t.maintenance} kcal</b>: BMR x activity multiplier ({ACTIVITY.find((a) => a.key === profile.activity)?.mult}) plus a 150 kcal average for the lifting program. <br />
          <b>Deficit {t.deficit} kcal</b>: sized so you lose about {(t.rate * 100).toFixed(2)}% of bodyweight per week. Helms, Aragon and Fitschen (2014) found 0.5 to 1% per week maximises muscle retention while dieting; the pace is set higher when you are further from goal and eases as you get close. Capped at 25% of maintenance and never below BMR. <br />
          <b>Protein {t.protein} g</b>: 2.5 g per kg of lean mass (you carry about {t.lbm.toFixed(1)} kg). The 2014 Helms review recommends 2.3 to 3.1 g/kg lean mass in a deficit; Morton et al. (2018) found gains plateau past about 1.6 to 2.2 g/kg bodyweight when not dieting. Higher protein also preserves muscle and keeps you fuller. <br />
          <b>Fat {t.fat} g</b>: 25% of calories, inside the recommended 15 to 30% band for hormone health. <b>Carbs {t.carbs} g</b> fill the rest to fuel training. <br />
          <b>Steps</b>: Paluch et al. (2022, Lancet Public Health) found health benefits plateau near 8,000 to 10,000 steps for adults under 60, so the target stays in that band (9,000 to 11,000, +2,000 on abs day). More steps burn more, but the deficit already handles fat loss, and a step goal that adds stress hurts recovery for no meaningful return. Set your own number in the profile if you prefer. <br />
          <b>Goal weight</b> assumes lean mass stays constant: lean mass / (1 - goal body fat). As a beginner you may add muscle at the same time, so the scale can move slower than this while you still get leaner. Re-measure weekly and trust the tape and the weekly averages over any single day.
        </div>
      </details>
    </section>
  )
}

// ---------- daily log ----------
function DailyLog({ state, update, targets }) {
  const [dateKey, setDateKey] = useState(todayKey())
  const d = state.daily?.[dateKey] || {}
  const set = (k) => (e) => update((s) => ({ ...s, daily: { ...s.daily, [dateKey]: { ...(s.daily?.[dateKey] || {}), [k]: e.target.value } } }))
  const within = (v, t, w) => v ? (Math.abs(+v - t) <= w || +v < t) : null
  const calOk = within(d.calories, targets.calories, targets.calorieWindow)
  const proOk = d.protein ? +d.protein >= targets.protein : null
  return (
    <section className="card">
      <div className="card-head"><h2>Daily log</h2>
        <div className="btn-row" style={{ alignItems: 'center' }}>
          <button className="btn sm ghost" onClick={() => setDateKey(addDays(dateKey, -1))}>Prev</button>
          <input type="date" className="input" style={{ width: 'auto', minHeight: 34, padding: '4px 10px' }} value={dateKey} max={todayKey()} onChange={(e) => e.target.value && setDateKey(e.target.value)} />
          <button className="btn sm ghost" disabled={dateKey >= todayKey()} onClick={() => setDateKey(addDays(dateKey, 1))}>Next</button>
        </div>
      </div>
      <div className="grid grid-3">
        <div className="field"><label>Morning weight (kg)</label><input className="input mono" type="number" step="0.1" placeholder="e.g. 78.4" value={d.weight ?? ''} onChange={set('weight')} /></div>
        <div className="field"><label>Calories eaten {calOk != null && <span className={calOk ? 'teal' : 'rose'}>{calOk ? 'on target' : 'over'}</span>}</label><input className="input mono" type="number" placeholder={String(targets.calories)} value={d.calories ?? ''} onChange={set('calories')} /></div>
        <div className="field"><label>Protein (g) {proOk != null && <span className={proOk ? 'teal' : 'rose'}>{proOk ? 'hit' : 'short'}</span>}</label><input className="input mono" type="number" placeholder={String(targets.protein)} value={d.protein ?? ''} onChange={set('protein')} /></div>
      </div>
      <p className="tiny faint" style={{ marginTop: 10 }}>Steps are logged on the Workout tab. Weigh in after the bathroom, before food, same time each day; the weekly average is what matters.</p>
    </section>
  )
}

// ---------- weekly measurements ----------
function Measurements({ state, update, showToast }) {
  const p = state.profile
  const wk = weekKey(todayKey())
  const existing = Object.keys(state.measurements || {}).filter((k) => weekKey(k) === wk).sort().pop()
  const m = existing ? state.measurements[existing] : {}
  const [f, setF] = useState({ neck: m.neck || '', waist: m.waist || '', hip: m.hip || '' })
  const set = (k) => (e) => setF({ ...f, [k]: e.target.value })
  const bf = navyBodyFat({ sex: p.sex, heightCm: p.heightCm, neckCm: +f.neck, waistCm: +f.waist, hipCm: +f.hip })
  const save = () => {
    const key = existing || todayKey()
    const weight = state.daily?.[todayKey()]?.weight || p.weightKg
    update((s) => ({
      ...s,
      measurements: { ...s.measurements, [key]: { ...(s.measurements?.[key] || {}), neck: +f.neck || undefined, waist: +f.waist || undefined, hip: +f.hip || undefined, bodyfat: bf != null ? +bf.toFixed(1) : undefined, weight: +weight } },
      profile: bf != null ? { ...s.profile, bodyFat: +bf.toFixed(1), neckCm: +f.neck, waistCm: +f.waist, hipCm: +f.hip || s.profile.hipCm } : s.profile,
    }))
    showToast('Measurements saved, targets updated')
  }
  const rows = Object.entries(state.measurements || {}).filter(([, v]) => v.bodyfat).sort().reverse().slice(0, 8)
  return (
    <section className="card">
      <div className="card-head"><h2>Weekly body fat check</h2><span className={'chip ' + (existing ? 'teal' : '')}>{existing ? 'done this week' : 'due this week'}</span></div>
      <div className="grid grid-3">
        {['neck', 'waist', 'hip'].map((k) => (
          <div className="field" key={k}><label style={{ textTransform: 'capitalize' }}>{k} (cm)</label><input className="input mono" type="number" step="0.1" value={f[k]} onChange={set(k)} /></div>
        ))}
      </div>
      <div className="btn-row" style={{ marginTop: 12, alignItems: 'center', justifyContent: 'space-between' }}>
        <span className="small muted">Estimated body fat: <b className="mono">{bf != null ? bf.toFixed(1) + '%' : '-'}</b></span>
        <button className="btn primary sm" onClick={save} disabled={bf == null}>Save measurements</button>
      </div>
      {rows.length > 0 && (
        <div style={{ marginTop: 14, overflowX: 'auto' }}>
          <table>
            <thead><tr><th>Date</th><th className="num">Weight</th><th className="num">BF%</th><th className="num">Neck</th><th className="num">Waist</th><th className="num">Hip</th></tr></thead>
            <tbody>{rows.map(([k, v]) => <tr key={k}><td>{fmtDate(k)}</td><td className="num">{v.weight ?? '-'}</td><td className="num">{v.bodyfat ?? '-'}</td><td className="num">{v.neck ?? '-'}</td><td className="num">{v.waist ?? '-'}</td><td className="num">{v.hip ?? '-'}</td></tr>)}</tbody>
          </table>
        </div>
      )}
    </section>
  )
}

// ---------- trends ----------
function Trends({ state, targets }) {
  const [metric, setMetric] = useState('weight')
  const weeks = useMemo(() => weeklyAverages(state.daily), [state.daily])
  const bfSeries = useMemo(() => Object.entries(state.measurements || {}).filter(([, v]) => v.bodyfat).sort().map(([k, v]) => ({ week: weekKey(k), bodyfat: v.bodyfat })), [state.measurements])
  const data = metric === 'bodyfat' ? bfSeries : weeks
  const ref = metric === 'calories' ? targets.calories : metric === 'protein' ? targets.protein : metric === 'steps' ? targets.steps : metric === 'bodyfat' ? targets.goalBf : metric === 'weight' ? targets.goalWeight : null
  const m = METRICS[metric]
  const last = weeks[weeks.length - 1], prev = weeks[weeks.length - 2]
  return (
    <section className="card">
      <div className="card-head"><h2>Weekly trend</h2></div>
      <div className="seg" style={{ marginBottom: 12, flexWrap: 'wrap' }}>
        {Object.keys(METRICS).map((k) => <button key={k} className={metric === k ? 'active' : ''} onClick={() => setMetric(k)}>{METRICS[k].label.split(' ')[0]}</button>)}
      </div>
      {last && metric !== 'bodyfat' && (
        <div className="stat-row" style={{ marginBottom: 12 }}>
          <div><div className="eyebrow">This week avg</div><div className="stat">{last[metric] ?? '-'}</div></div>
          {prev && last[metric] != null && prev[metric] != null && <div><div className="eyebrow">vs last week</div><div className={'stat ' + ((last[metric] - prev[metric]) < 0 && metric === 'weight' ? 'teal' : '')}>{last[metric] - prev[metric] > 0 ? '+' : ''}{(last[metric] - prev[metric]).toFixed(1)}</div></div>}
          <div><div className="eyebrow">Days logged</div><div className="stat">{last.days}</div></div>
        </div>
      )}
      {data.length === 0 ? <p className="muted small">Nothing logged yet. Weekly averages appear here after your first entries.</p> : (
        <div style={{ height: 240 }}>
          <ResponsiveContainer>
            <LineChart data={data} margin={{ top: 8, right: 8, left: -10, bottom: 0 }}>
              <CartesianGrid stroke="#262C38" vertical={false} />
              <XAxis dataKey="week" stroke="#7B8494" fontSize={11} tickLine={false} axisLine={false} tickFormatter={(w) => fmtDate(w)} />
              <YAxis stroke="#7B8494" fontSize={11} tickLine={false} axisLine={false} domain={['auto', 'auto']} />
              <Tooltip contentStyle={{ background: '#1C212C', border: '1px solid #343B4A', borderRadius: 9, fontSize: 12 }} labelStyle={{ color: '#B8BFCC' }} itemStyle={{ color: '#fff' }} labelFormatter={(w) => 'Week of ' + fmtDate(w)} formatter={(v) => [v, m.label]} />
              {ref != null && <ReferenceLine y={ref} stroke="#5FB3A1" strokeDasharray="4 4" label={{ value: metric === 'weight' || metric === 'bodyfat' ? 'goal' : 'target', fill: '#5FB3A1', fontSize: 11, position: 'right' }} />}
              <Line type="monotone" dataKey={metric} stroke={m.color} strokeWidth={2.5} dot={{ r: 4, fill: m.color, strokeWidth: 0 }} connectNulls isAnimationActive={false} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}
      <p className="tiny faint" style={{ marginTop: 8 }}>If the weekly weight average has not dropped for two weeks in a row while calories were on target, lower calories by about 100 kcal. If it drops faster than {(targets.rate * 100 * 1.5).toFixed(1)}% a week, add 100 kcal back so you keep muscle.</p>
    </section>
  )
}

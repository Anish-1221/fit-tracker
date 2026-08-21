import { CYCLE, DAYS } from '../data/program'

// ---------- units ----------
export const lbToKg = (lb) => lb * 0.45359237
export const kgToLb = (kg) => kg / 0.45359237
export const ftInToCm = (ft, inch) => (ft * 12 + inch) * 2.54
export const cmToIn = (cm) => cm / 2.54

// ---------- dates ----------
export const todayKey = () => toKey(new Date())
export function toKey(d) {
  const y = d.getFullYear(), m = String(d.getMonth() + 1).padStart(2, '0'), day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}
export const fromKey = (k) => { const [y, m, d] = k.split('-').map(Number); return new Date(y, m - 1, d) }
export const addDays = (k, n) => { const d = fromKey(k); d.setDate(d.getDate() + n); return toKey(d) }
export const diffDays = (a, b) => Math.round((fromKey(b) - fromKey(a)) / 86400000)
// ISO-ish week key: Monday start
export function weekKey(k) {
  const d = fromKey(k); const dow = (d.getDay() + 6) % 7; d.setDate(d.getDate() - dow); return toKey(d)
}
export const fmtDate = (k, opts = { month: 'short', day: 'numeric' }) => fromKey(k).toLocaleDateString(undefined, opts)

// ---------- body composition ----------
// Mifflin-St Jeor (1990). Weight kg, height cm, age years.
export function bmr({ weightKg, heightCm, age, sex }) {
  const base = 10 * weightKg + 6.25 * heightCm - 5 * age
  return sex === 'female' ? base - 161 : base + 5
}

export const ACTIVITY = [
  { key: 'sedentary', label: 'Desk job, little walking', mult: 1.2 },
  { key: 'light', label: 'Light: on feet some of the day', mult: 1.375 },
  { key: 'moderate', label: 'Moderate: active most days', mult: 1.55 },
  { key: 'very', label: 'Very active: physical job or lots of sport', mult: 1.725 },
]

// US Navy circumference method (Hodgdon and Beckett 1984). Inputs in cm.
export function navyBodyFat({ sex, heightCm, neckCm, waistCm, hipCm }) {
  const h = cmToIn(heightCm), n = cmToIn(neckCm), w = cmToIn(waistCm)
  if (!(h > 0 && n > 0 && w > n)) return null
  if (sex === 'female') {
    const hp = cmToIn(hipCm || 0)
    if (!(hp > 0)) return null
    return 163.205 * Math.log10(w + hp - n) - 97.684 * Math.log10(h) - 78.387
  }
  return 86.01 * Math.log10(w - n) - 70.041 * Math.log10(h) + 36.76
}

// ---------- targets ----------
// Loss rate follows Helms, Aragon and Fitschen 2014 (JISSN 11:20):
// 0.5-1% of bodyweight per week maximises muscle retention. We pick a rate
// inside that band based on how far you are from goal body fat, so the deficit
// is larger when there is more fat to lose and gentler near the goal.
export function lossRate(bfGap) {
  if (bfGap <= 0) return 0
  if (bfGap <= 3) return 0.005
  if (bfGap <= 6) return 0.006
  if (bfGap <= 10) return 0.0075
  return 0.009
}

export function computeTargets(p) {
  if (!p || !p.weightKg || !p.heightCm || !p.age) return null
  const bfNow = p.bodyFat ?? null
  const goalBf = p.goalBodyFat ?? null
  const BMR = bmr(p)
  const act = ACTIVITY.find((a) => a.key === p.activity) || ACTIVITY[1]
  const TDEE = BMR * act.mult
  // Lifting adds roughly 200-300 kcal per session; over a 7-day cycle with
  // 4 lifting days plus an abs day we add a modest daily average.
  const training = 150
  const maintenance = Math.round(TDEE + training)

  const lbm = bfNow != null ? p.weightKg * (1 - bfNow / 100) : p.weightKg * 0.8
  const gap = bfNow != null && goalBf != null ? bfNow - goalBf : 0
  const rate = lossRate(gap)
  // 1 kg of fat tissue is about 7700 kcal.
  let deficit = Math.round((rate * p.weightKg * 7700) / 7)
  // Cap at 25% of maintenance so training quality holds, and never below BMR.
  deficit = Math.min(deficit, Math.round(maintenance * 0.25))
  let calories = maintenance - deficit
  calories = Math.max(calories, Math.round(BMR))

  // Protein: Helms 2014 recommends 2.3-3.1 g/kg of lean mass in a deficit;
  // Morton 2018 found gains plateau around 1.6-2.2 g/kg bodyweight when not
  // dieting. We use 2.5 g/kg lean mass, floored at 1.8 g/kg bodyweight.
  const protein = Math.round(Math.max(2.5 * lbm, 1.8 * p.weightKg))
  // Fat at 25% of calories (within the 15-30% band), carbs fill the rest.
  const fat = Math.round((calories * 0.25) / 9)
  const carbs = Math.max(0, Math.round((calories - protein * 4 - fat * 9) / 4))

  // Goal weight assumes lean mass is held while fat drops.
  const goalWeight = goalBf != null ? lbm / (1 - goalBf / 100) : null
  const weeklyLossKg = rate * p.weightKg
  const weeksToGoal = goalWeight && weeklyLossKg > 0 ? Math.ceil((p.weightKg - goalWeight) / weeklyLossKg) : null

  return {
    BMR: Math.round(BMR), TDEE: Math.round(TDEE), maintenance, deficit, calories,
    protein, fat, carbs, lbm, bfNow, goalBf, gap, rate, goalWeight, weeksToGoal,
    steps: stepTarget(gap), absDaySteps: stepTarget(gap) + 3000,
    calorieWindow: 100, // within +-100 kcal counts as on target
  }
}

// Step target: Paluch et al. 2022 (Lancet Public Health) found benefits for
// adults under 60 plateau around 8,000-10,000 steps. We start at 10k and scale
// up with body fat gap because walking is the lowest-fatigue way to raise
// expenditure without hurting lifting recovery.
export function stepTarget(gap) {
  if (gap <= 3) return 9000
  if (gap <= 6) return 10000
  if (gap <= 10) return 12000
  return 14000
}

// ---------- cycle ----------
// Walk forward from the cycle start. Rest days are consumed by the calendar.
// A workout slot is consumed only when a session was logged on that date or
// the date was explicitly skipped. A missed day pauses the cycle so the
// missed session shows the next day and the rest days shift with it.
export function buildSchedule(state, untilKey) {
  const start = state.cycle?.startDate
  if (!start) return { byDate: {}, todaySlot: null, index: 0 }
  const skipped = new Set(state.cycle?.skipped || [])
  const byDate = {}
  let i = state.cycle?.startIndex || 0
  const end = untilKey || todayKey()
  let d = start
  const last = diffDays(start, end) >= 0 ? end : start
  while (diffDays(d, last) >= 0) {
    const slot = CYCLE[i % CYCLE.length]
    const logged = state.workouts?.[d]
    if (slot === 'rest') {
      if (logged) { byDate[d] = { slot: logged.day, status: 'done', extra: true } } else byDate[d] = { slot, status: 'rest' }
      i++
    } else if (logged) {
      byDate[d] = { slot: logged.day, status: 'done' }; i++
    } else if (skipped.has(d)) {
      byDate[d] = { slot, status: 'skipped' }; i++
    } else if (d !== last) {
      byDate[d] = { slot, status: 'missed' }
    } else {
      byDate[d] = { slot, status: 'planned' }
    }
    d = addDays(d, 1)
  }
  const todaySlot = byDate[last]?.slot || CYCLE[i % CYCLE.length]
  // Preview the next 7 days assuming everything is done on time.
  const upcoming = []
  const st = byDate[last]?.status
  let j = st === 'planned' || st === 'missed' ? i + 1 : i
  let dd = addDays(last, 1)
  for (let n = 0; n < 7; n++) {
    upcoming.push({ date: dd, slot: CYCLE[j % CYCLE.length] })
    j++; dd = addDays(dd, 1)
  }
  return { byDate, todaySlot, index: i, upcoming }
}

export const dayLabel = (slot) => DAYS[slot]?.label || slot

// ---------- aggregation ----------
export function weeklyAverages(daily) {
  const weeks = {}
  Object.entries(daily || {}).forEach(([k, v]) => {
    const w = weekKey(k)
    weeks[w] ||= { week: w, weight: [], calories: [], protein: [], steps: [] }
    if (v.weight) weeks[w].weight.push(+v.weight)
    if (v.calories) weeks[w].calories.push(+v.calories)
    if (v.protein) weeks[w].protein.push(+v.protein)
    if (v.steps) weeks[w].steps.push(+v.steps)
  })
  const avg = (a) => (a.length ? +(a.reduce((x, y) => x + y, 0) / a.length).toFixed(1) : null)
  return Object.values(weeks)
    .sort((a, b) => (a.week < b.week ? -1 : 1))
    .map((w) => ({ week: w.week, weight: avg(w.weight), calories: avg(w.calories), protein: avg(w.protein), steps: avg(w.steps), days: Math.max(w.weight.length, w.calories.length) }))
}

// Epley estimated one-rep max, used only as a progression index.
export const e1rm = (w, r) => (w && r ? Math.round(w * (1 + r / 30)) : 0)

// Day score for the calendar: returns { level: 0..3, hits: [...], misses: [...] }
export function dayScore(state, dateKey, schedule, targets) {
  const sched = schedule.byDate[dateKey]
  const daily = state.daily?.[dateKey] || {}
  const checks = []
  if (sched && sched.status !== 'rest') {
    checks.push({ key: 'workout', ok: sched.status === 'done' })
  }
  if (targets) {
    if (daily.calories) checks.push({ key: 'calories', ok: Math.abs(+daily.calories - targets.calories) <= targets.calorieWindow || +daily.calories < targets.calories })
    else checks.push({ key: 'calories', ok: false, empty: true })
    if (daily.protein) checks.push({ key: 'protein', ok: +daily.protein >= targets.protein })
    else checks.push({ key: 'protein', ok: false, empty: true })
    const stepGoal = sched?.slot === 'abs' ? targets.absDaySteps : targets.steps
    if (daily.steps) checks.push({ key: 'steps', ok: +daily.steps >= stepGoal })
    else checks.push({ key: 'steps', ok: false, empty: true })
  }
  const hits = checks.filter((c) => c.ok).length
  const logged = checks.some((c) => !c.empty) || !!state.workouts?.[dateKey]
  let level = 0
  if (logged) {
    if (checks.length && hits === checks.length) level = 3
    else if (hits >= Math.ceil(checks.length / 2)) level = 2
    else level = 1
  }
  return { level, hits, total: checks.length, checks }
}

export function streak(state, schedule, targets) {
  let n = 0
  let d = todayKey()
  // today counts if already full; otherwise start from yesterday
  if (dayScore(state, d, schedule, targets).level < 2) d = addDays(d, -1)
  while (n < 400) {
    const s = dayScore(state, d, schedule, targets)
    if (s.level >= 2) { n++; d = addDays(d, -1) } else break
  }
  return n
}

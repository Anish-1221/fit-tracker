# Fit Tracker

A personal workout, nutrition, body composition, physique and hair routine tracker. Single user, no login, runs entirely in the browser, hosted on GitHub Pages at https://Anish-1221.github.io/fit-tracker/

Data is stored in the browser (localStorage) and optionally synced across devices through a private GitHub Gist.

---

## Contents

1. [Getting started](#getting-started)
2. [How the site is organised](#how-the-site-is-organised)
3. [Workout tab](#workout-tab)
4. [Nutrition tab](#nutrition-tab)
5. [Streak tab](#streak-tab)
6. [Hair tab](#hair-tab)
7. [Plan tab](#plan-tab)
8. [The program](#the-program)
9. [The science behind the numbers](#the-science-behind-the-numbers)
10. [When to change what](#when-to-change-what)
11. [Data, sync and backups](#data-sync-and-backups)
12. [Development and deployment](#development-and-deployment)
13. [Editing the program or formulas](#editing-the-program-or-formulas)

---

## Getting started

First time on a device:

1. Open the site. On a phone, add it to the home screen so it opens full screen.
2. **Workout tab**: set the cycle start date and which session you start with. Do this once.
3. **Nutrition tab**: fill in the profile (age, weight in kg, height in ft/in, activity, neck and waist in cm, goal body fat %). The site computes your targets.
4. **Plan tab → Cloud sync** (optional but recommended if you use two devices): paste a GitHub personal access token with only the `gist` scope. Repeat on each device. Data merges automatically; the newer copy wins.

Daily routine:

- Morning: log weight on the Nutrition tab.
- Gym: open the Workout tab, log each set, use the rest timer, save the session.
- Evening: log calories, protein and steps.
- Once a week (same morning, before food): body fat check (neck, waist, hip) and, if you use it, the physique measurements.

---

## How the site is organised

Four tabs in the bottom bar.

| Tab | What it is for |
|---|---|
| Workout | Today's session, logging sets, rest timer, steps, cardio, progress charts |
| Nutrition | Profile and targets, daily weight/calories/protein, weekly body fat, trends, physique tracking |
| Streak | Monthly heatmap of goal-met days, current and best streak, per-day breakdown |
| Hair | Daily hair routine checklist, 52-week timeline with checkpoints, monthly photo check-ins, evidence |
| Plan | Full program with rest times, the science, cloud sync, backups |

Everything saves as you type. The dot in the top right shows sync state: grey means local only, amber means saving, green means synced, red means a sync error (hover or tap for the message).

---

## Workout tab

### Cycle setup
The program runs in a fixed seven-day loop: Upper 1, Lower 1, Rest, Upper 2, Lower 2, Abs + cardio, Rest. You pick the start date and the first session once. After that the site decides what today is.

Rules of the cycle:
- Rest days are consumed by the calendar.
- A workout day is consumed only when you log a session on it or explicitly skip it.
- If you miss a session, it does not disappear. It stays as "missed" and shows again the next day; the rest days shift along with it.
- "Skip session" moves the cycle forward without logging anything. "Undo skip" reverses it.
- Logging a session on a rest day counts as an extra session and also moves the cycle forward.
- "Reset cycle start" on the Plan tab lets you re-anchor the loop; logged sessions are kept.

### The cycle dial
The ring with seven segments shows where you are in the loop. Teal segments are done, amber is today, thin grey segments are rest days. Below it, "Next:" previews the coming week assuming you train on schedule.

### Date navigation
Prev day / Next day / Today, or pick a date. You can log past sessions; the cycle recalculates. Future dates are not selectable.

### Activity card
- **Steps**: enter the day's step count. The chip shows today's step goal (higher on abs day).
- **Cardio** (abs day only): add one or more entries with type (walk, incline walk, run, cycling, swimming, badminton, table tennis, other) and minutes. Target is 20 to 30 minutes easy cardio on that day.

### Session card
One block per exercise:
- **Name, muscles, movement pattern** and chips for sets x reps, rest time, and a "Form video" link (opens a YouTube search for the exercise).
- **Alternatives dropdown**: exercises that hit the same muscles with the same pattern, ordered easiest first. Options we agreed on together are marked "(discussed)". Your choice is remembered per slot and becomes the default next time.
- **Last session line**: what you did last time for this exact exercise, plus whether you marked it as max or had more.
- **Set rows**: weight in lb and reps (seconds for timed abs work). Weights prefill from last session, reps stay empty. The stopwatch button starts the rest timer for that exercise's prescribed rest.
- **Effort toggle**: "Had more in the tank" or "That was my max". This drives the progression rule.
- **+ set / - set** to change the set count for the day.
- **Notes** per exercise (seat settings, form cues) and session notes at the bottom.
- **Focus** chip: exercises added by a physique focus block (see Nutrition).

**Save session** stores it and marks the day done. **Delete** removes a saved session. You need at least one set with reps entered to save.

### Rest timer
A floating pill appears at the bottom when a timer runs: exercise name, countdown, +30 seconds, Done. It counts past zero so you can see how long you actually rested. Phones vibrate when it hits zero.

### Progress card
Pick any exercise you have logged. Metric toggle:
- **Top**: heaviest set of the session
- **1RM**: estimated one-rep max (Epley: weight x (1 + reps/30)), a single number that rewards both more weight and more reps
- **Volume**: sum of weight x reps
- **Reps**: total reps

Shows latest value, change vs previous session, session count and a line chart.

---

## Nutrition tab

### Profile
Sex, age, weight (kg), height (ft, in), activity outside the gym, neck, waist and hip (cm), optional body fat override, goal body fat %. Saving computes targets and seeds the first weekly measurement. Edit any time with "Edit profile".

### Daily targets card
Calories, protein, carbs, fat, steps (normal day / abs day), current body fat, goal, goal weight, loss pace, estimated weeks to goal. "How these are calculated" explains every number with the source study.

Targets are live: they recompute from your **latest weekly average weight** and your **latest saved body fat**. You do not need to re-enter your weight in the profile.

### Daily log
Morning weight, calories eaten, protein eaten, with date navigation. Chips show on target / over / hit / short against the targets. Steps are entered on the Workout tab.

### Weekly body fat check
Neck, waist, hip. Shows the Navy-method estimate live and saves it. One entry per week; re-saving within the same week overwrites it. The table shows your history.

### Weekly trend
Weekly averages of weight, calories, protein, steps, and the body fat series, with the goal or target as a dashed line. Weekly averages smooth out daily water swings; this is the number to make decisions on.

### Physique tracking (optional)
Off until you start it by entering wrist, ankle and knee (bone sites; they never change and set your reference proportions).

Then a weekly form with ten sites: shoulders, chest, left and right upper arm (flexed), left and right forearm, left and right thigh, left and right calf. Fill any subset.

The **Proportions** card shows each group:
- Now (cm), Reference (your bones x the classic ratio), % of reference, and the change over the last 8 weeks.

Flags:
- **behind the rest**: the group is 5 or more points below your median %.
- **not growing**: needs 8 weeks and 3 readings; flagged when the group changed less than half a cm while at least one other group grew by 1 cm or more. This filters out the "everything shrinks on a cut" case.
- **left/right gap**: the sides differ by more than 1 cm.

**Suggested focus**: up to two groups, ranked by how far behind they are. "Add focus block" appends one exercise of 2 to 3 sets to each upper or lower day that already trains the group. Focus exercises show in sessions, in the Plan tab and in Progress. Remove the block from the same card. Asymmetry does not add volume; the fix is unilateral work starting with the weaker side.

**Girth history** charts the groups over time; tap the chips to show or hide groups.

---

## Streak tab

- **Current streak**, **best streak**, full and partial days this month.
- **Monthly heatmap**: each cell shows the date and the cycle slot (U1, L1, U2, L2, AB, R). Shade shows the day's score: nothing logged, logged, half or more of targets, all targets. Today has a white outline. Tap a day to see its breakdown.
- **Day breakdown**: each target (workout if scheduled, calories, protein, steps) with your value, the goal and hit / missed / not logged, plus the sets you logged.

Scoring: a day is **full** when every applicable target is hit, **partial** when at least half are. Streaks count partial or better. Rest days only need calories, protein and steps. Calories count as hit when within 100 kcal of target or under it. If the hair routine is active and set to count, it is one more target: hit when every enabled habit is ticked that day.

---

## Hair tab

Optional. Built for pattern (androgenetic) thinning at the crown and hairline using only natural, vegetarian options that have human trial evidence. It is a routine tracker, not a treatment guarantee; the card "The honest baseline" explains the limits and why a dermatologist visit plus a blood panel (ferritin, vitamin D, zinc, B12, TSH) is step one.

**Setup**: pick the habits you will do and a start date.

**Habits** (each with its source in the Evidence card):
- Scalp massage 4 to 5 min daily (Koyama 2016)
- Rosemary oil on the scalp, evenings (Panahi 2015, matched minoxidil 2% at 6 months)
- Pumpkin seed oil or seeds with food daily (Cho 2014, 400 mg/day, 24 weeks)
- Hit protein target (auto-filled from the nutrition log)
- 7+ hours sleep
- Gentle handling (no heat, rough towelling, tight caps)

**Timeline**: a 52-week bar with checkpoints at week 0 (baseline photos and labs), 4 (expect a temporary shed), 12 (first photos, judge shedding only), 24 (main checkpoint, where both trials showed results; if clearly worse, escalate to a dermatologist for microneedling, low-level laser or medication), and 52.

**Today's routine**: tap to tick habits, with date navigation. **Weekly adherence**: per-habit days done per week; target 6 of 7. **Monthly check-in**: photos taken, crown and hairline ratings 1 to 5, shedding vs last month, notes; saved as a history table. **Settings**: toggle habits, include or exclude the routine from the Streak calendar, stop the routine.

The Evidence card also covers diet for a vegetarian in a deficit (protein, iron with vitamin C, zinc, vitamin D, B12, omega-3) and what to avoid (megadose biotin, high vitamin A, crash dieting).

---

## Plan tab

- **The program**: cycle overview, one table per day with exercise, muscles, sets x reps and rest; your chosen alternative is shown with "swapped from ..." and focus exercises are marked. Exercise names link to form videos. "Rest time and recovery" explains the rest and frequency science.
- **Cloud sync**: connect with a `gist` scoped token, pull from cloud, disconnect.
- **Your data**: download a JSON backup, restore one, reset the cycle start, erase everything on this device.

---

## The program

Dr. Swole's low-volume upper/lower split adapted for a gym with dumbbells, machines and cables but no barbell or plates, plus one abs and cardio day.

**Upper 1**: flat dumbbell bench 3x5-8, seated dumbbell overhead press 2x6-10, chest-supported row 3x6-10, lat pulldown 2x10-15, dumbbell curl 3x8-12, lying dumbbell skullcrusher 3x8-12, dumbbell upright row 4x8-12.

**Lower 1**: goblet squat 3x5-8, dumbbell RDL 2x6-10, Bulgarian split squat 3x8-12 (your swap for leg press), walking lunge 3x8-12, single-leg calf raise 3x8-12, captain's chair leg raise 3x8-12 (your swap for hanging leg raise).

**Upper 2**: standing dumbbell overhead press 2x5-8, incline dumbbell bench 3x8-12, chin-up 3x6-10 (assisted if needed), single-arm row 2x8-12, incline curl 3x10-15, close-grip dumbbell press 3x6-10, lateral raise 4x10-15.

**Lower 2**: dumbbell deadlift 2x5-8, Bulgarian split squat 3x6-10, leg extension 3x10-15, leg curl 3x10-15, machine calf raise 3x10-15, weighted crunch 3x10-15.

**Abs + cardio**: plank 3x30-60 s, dead bug 3x8-12 per side, side plank 3x20-45 s per side, cable crunch 3x12-15, then 20 to 30 minutes easy cardio and a step goal 3,000 higher than usual.

Rest times: 3 min on heavy compounds (bench, squat pattern, hinge, overhead press, chin-up), 2 min on lighter compounds, 90 s on isolation work, 60 s on abs.

---

## The science behind the numbers

- **Rest between sets**: Schoenfeld et al. 2016, J Strength Cond Res. 3 minute rests produced more strength and size than 1 minute with matched sets. A 2024 meta-analysis confirmed a benefit for rests over 60 s.
- **Frequency and spacing**: Schoenfeld 2016 meta-analysis, twice a week per muscle beats once; Grgic 2018, 48 to 72 h between sessions for the same muscle. The seven-day loop gives every muscle two hits with 72 h gaps and two full rest days.
- **Resting energy**: Mifflin-St Jeor equation, the most accurate common formula in validation studies.
- **Body fat**: US Navy circumference method (Hodgdon and Beckett). Typical error is 3 to 4 points versus DXA, but it is consistent week to week when measured the same way, which is what matters for trend.
- **Loss rate**: Helms, Aragon and Fitschen 2014, JISSN. 0.5 to 1% of bodyweight per week preserves muscle. The site picks 0.5% near goal up to 0.9% far from it, caps the deficit at 25% of maintenance, and never drops calories below BMR.
- **Protein**: Helms 2014 recommends 2.3 to 3.1 g/kg lean mass in a deficit; Morton et al. 2018 found gains plateau around 1.6 to 2.2 g/kg bodyweight. The site uses 2.5 g/kg lean mass, floored at 1.8 g/kg bodyweight.
- **Fat**: 25% of calories, inside the 15 to 30% band for hormone health. Carbs fill the rest.
- **Steps**: Paluch et al. 2022, Lancet Public Health. Benefits plateau around 8,000 to 10,000 steps for adults under 60. Target starts at 9,000 and scales to 14,000 with distance from goal body fat.
- **Volume for a lagging muscle**: Schoenfeld, Ogborn and Krieger 2017. Each extra weekly set adds about 0.37% growth; 10+ sets per week per muscle beats fewer than 5. A focus block adds 5 to 6 weekly sets to one group.
- **Tape reliability**: standardised protocols give about 1 cm minimal detectable change; smaller differences are noise.
- **Hypertrophy timeline**: measurable muscle growth takes roughly 6 to 8 weeks; earlier changes are mostly fluid, which is why trend flags wait 8 weeks.
- **Proportion references**: Steve Reeves (arm 2.52x wrist, calf 1.92x ankle, thigh 1.75x knee, neck about equal to arm) and John McCallum (relaxed chest 6.5x wrist, forearm about 0.8x arm). These are aesthetic conventions, used only to rank your groups against each other.

---

## When to change what

**Weights (every session)**
- Hit the top of the rep range on every set and marked "Had more in the tank": add 5 lb total next time (2.5 lb per dumbbell), or the next machine pin.
- Marked "That was my max": keep the weight, work the reps up.
- Missed the bottom of the range on two sessions in a row: drop 10% and rebuild.

**Exercise choice**
- Swap to an alternative when an exercise hurts, when you run out of dumbbells, or when a machine is taken. Stay on one variation for at least 4 to 6 weeks so progress is comparable.

**Calories (check the weekly trend every Sunday)**
- Weekly average weight flat for two weeks with calories on target: lower calories by 100.
- Losing faster than 1.5x your pace: add 100 back.
- Losing on pace: change nothing. Targets already re-scale as your weight drops.

**Body fat and measurements (weekly)**
- Re-measure every week, same conditions. Re-saving in the same week overwrites, so if a measurement was taken bloated or after eating, just redo it the next morning.
- Update the profile only when age, height, activity level or goal body fat change.

**Goal body fat**
- Reaching goal: set a new goal or set goal equal to current; the deficit goes to zero and the site gives maintenance calories.

**Physique focus blocks (every 8 weeks)**
- Only act on flags once the 8 week change column has data.
- Add a block for at most two groups. Leave it for 8 weeks, then re-check. Remove it when the group is no longer flagged.
- Left/right gap: switch that exercise to its single-limb version and lead with the weaker side.

**Hair routine (monthly, and at the week 12 / 24 checkpoints)**
- Do not judge before week 12; do not decide before week 24.
- Adherence under 4 days a week on the oil or massage: fix consistency before changing anything.
- Week 24 photos clearly worse: the natural routine has had a fair trial, see a dermatologist about non-drug options (microneedling, low-level laser) or medication.
- Scalp irritation from rosemary oil: dilute more (fewer drops per teaspoon of carrier) or drop to alternate nights.

**Cycle**
- Missed a day: do nothing, the session waits.
- Travelling or sick for a week or more: use "Reset cycle start" when you are back so rest days land where you want.

**Sleep, stress, plateaus**
- If several exercises stall together for 3+ weeks, check sleep and calories before touching the program. In a deficit, strength holding steady is a win.

---

## Data, sync and backups

- **Local**: everything is in the browser's localStorage under `fit-tracker:data`. Clearing site data deletes it, so keep backups.
- **Cloud sync**: a private Gist named `Fit Tracker data` containing `fit-tracker-data.json`. The token is stored only in the browser (`fit-tracker:settings`) and never leaves your devices except to talk to api.github.com. On load the site pulls the Gist and keeps whichever copy has the newer `updatedAt`; every change pushes after 1.5 s.
- **Conflicts**: last write wins. Avoid editing the same day on two devices at once.
- **Backup**: Plan tab → Download backup gives a JSON file. Restore replaces everything on the device and syncs up.
- **Token**: GitHub → Settings → Developer settings → Personal access tokens → Tokens (classic) → Generate → tick only `gist`. If it expires, generate a new one and reconnect; the Gist is found automatically.

---

## Development and deployment

```
npm install
npm run dev        # local server
npm run build      # production build to dist/
```

Pushing to `main` triggers `.github/workflows/deploy.yml`, which builds and deploys `dist/` to GitHub Pages. Repo settings needed once: Pages source = GitHub Actions; Actions workflow permissions = read and write.

Stack: React 19, Vite, Recharts. No backend.

---

## Editing the program or formulas

- `src/data/program.js`: every exercise, its alternatives, sets, reps, rest seconds, the cycle order, cardio types, physique sites and focus exercises. Add an alternative by appending to an exercise's `alternatives` array; add a focus exercise under `FOCUS`.
- `src/lib/calc.js`: BMR, body fat, targets, loss rate bands, step bands, cycle scheduling, streak scoring, physique analysis thresholds (`TAPE_NOISE`, `FOCUS_MIN_WEEKS`, `FOCUS_MIN_READINGS`).
- `src/lib/storage.js`: localStorage and Gist sync.
- `src/styles.css`: theme tokens at the top.
- `src/tabs/*.jsx` and `src/components/Physique.jsx`: the screens. Hair habits and checkpoints are defined at the top of `src/tabs/Hair.jsx`.

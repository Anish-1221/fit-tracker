// Program: Dr. Swole low-volume upper/lower, dumbbell and machine version,
// plus one short abs + cardio day. Seven-slot cycle.
//
// Rest intervals follow Schoenfeld et al. 2016 (J Strength Cond Res 30:1805):
// 3 min rest beat 1 min for both strength and hypertrophy, and the 2024
// Singer meta-analysis confirmed a benefit for rests over 60 s. Practical
// rule used here: 150-180 s on heavy compounds, 90-120 s on lighter
// compounds and isolation work, 60 s on abs.
//
// Spacing follows ACSM and Grgic/Schoenfeld 2018: each muscle trained
// twice a week with 48-72 h between sessions, at least one full rest day.

export const yt = (q) =>
  'https://www.youtube.com/results?search_query=' + encodeURIComponent(q + ' form')

const REST = { heavy: 180, compound: 120, iso: 90, abs: 60 }

// Alternatives: same primary muscle and movement pattern, ordered easiest first.
// "discussed: true" marks swaps we already agreed on together.
export const EXERCISES = {
  // ---------- Upper 1 ----------
  db_bench: {
    name: 'Flat dumbbell bench press',
    muscles: 'Chest, front delts, triceps',
    pattern: 'Horizontal press',
    sets: 3, reps: '5-8', rest: REST.heavy,
    alternatives: [
      { id: 'machine_chest_press', name: 'Machine chest press', muscles: 'Chest, front delts, triceps', note: 'Easiest to learn, fixed path' },
      { id: 'pushup', name: 'Push-up (elevated if needed)', muscles: 'Chest, front delts, triceps', note: 'Bodyweight, progress by lowering hands' },
      { id: 'db_floor_press', name: 'Dumbbell floor press', muscles: 'Chest, triceps', note: 'Shorter range, shoulder friendly' },
      { id: 'db_bench', name: 'Flat dumbbell bench press', muscles: 'Chest, front delts, triceps', discussed: true, note: 'Program default' },
    ],
  },
  db_ohp_1: {
    name: 'Seated dumbbell overhead press',
    muscles: 'Front and side delts, triceps',
    pattern: 'Vertical press',
    sets: 2, reps: '6-10', rest: REST.compound,
    alternatives: [
      { id: 'machine_shoulder_press', name: 'Machine shoulder press', muscles: 'Front and side delts, triceps', note: 'Fixed path, easiest' },
      { id: 'db_ohp_1', name: 'Seated dumbbell overhead press', muscles: 'Front and side delts, triceps', discussed: true, note: 'Program default' },
      { id: 'arnold_press', name: 'Arnold press', muscles: 'Front and side delts', note: 'More side delt, lighter weight' },
    ],
  },
  cs_row: {
    name: 'Chest-supported dumbbell row',
    muscles: 'Lats, mid back, rear delts, biceps',
    pattern: 'Horizontal pull',
    sets: 3, reps: '6-10', rest: REST.compound,
    alternatives: [
      { id: 'machine_row', name: 'Seated machine row', muscles: 'Lats, mid back, rear delts', note: 'Fixed path, easiest' },
      { id: 'cable_row', name: 'Seated cable row', muscles: 'Lats, mid back, rear delts, biceps', note: 'Neutral grip handle' },
      { id: 'cs_row', name: 'Chest-supported dumbbell row', muscles: 'Lats, mid back, rear delts, biceps', discussed: true, note: 'Replaces T-bar row' },
      { id: 'one_arm_row', name: 'Single-arm dumbbell row', muscles: 'Lats, mid back, biceps', discussed: true, note: 'Lets you go heavier' },
    ],
  },
  lat_pulldown: {
    name: 'Lat pulldown',
    muscles: 'Lats, biceps',
    pattern: 'Vertical pull',
    sets: 2, reps: '10-15', rest: REST.compound,
    alternatives: [
      { id: 'lat_pulldown', name: 'Lat pulldown', muscles: 'Lats, biceps', discussed: true, note: 'Program default' },
      { id: 'assisted_pullup', name: 'Assisted pull-up (machine or band)', muscles: 'Lats, biceps', discussed: true, note: 'Reduce assistance over time' },
      { id: 'straight_arm_pulldown', name: 'Straight-arm cable pulldown', muscles: 'Lats', note: 'Isolation, lighter' },
    ],
  },
  db_curl: {
    name: 'Standing dumbbell curl',
    muscles: 'Biceps',
    pattern: 'Elbow flexion',
    sets: 3, reps: '8-12', rest: REST.iso,
    alternatives: [
      { id: 'db_curl', name: 'Standing dumbbell curl', muscles: 'Biceps', discussed: true, note: 'Replaces barbell curl' },
      { id: 'hammer_curl', name: 'Hammer curl', muscles: 'Biceps, brachialis, forearms', note: 'Neutral grip, wrist friendly' },
      { id: 'cable_curl', name: 'Cable curl', muscles: 'Biceps', note: 'Constant tension' },
      { id: 'ez_curl', name: 'EZ bar curl', muscles: 'Biceps', discussed: true, note: 'Only if the gym has an EZ bar' },
    ],
  },
  db_skull: {
    name: 'Lying dumbbell skullcrusher',
    muscles: 'Triceps (long and lateral head)',
    pattern: 'Elbow extension',
    sets: 3, reps: '8-12', rest: REST.iso,
    alternatives: [
      { id: 'cable_pushdown', name: 'Cable pushdown', muscles: 'Triceps', note: 'Easiest, elbow friendly' },
      { id: 'db_overhead_ext', name: 'Overhead dumbbell extension', muscles: 'Triceps (long head)', discussed: true, note: 'Best long head stretch' },
      { id: 'db_skull', name: 'Lying dumbbell skullcrusher', muscles: 'Triceps', discussed: true, note: 'Replaces EZ bar skullcrusher' },
    ],
  },
  db_upright: {
    name: 'Dumbbell upright row',
    muscles: 'Side delts, traps',
    pattern: 'Shoulder abduction',
    sets: 4, reps: '8-12', rest: REST.iso,
    alternatives: [
      { id: 'db_lateral_1', name: 'Dumbbell lateral raise', muscles: 'Side delts', discussed: true, note: 'Use this if upright rows bother your shoulders' },
      { id: 'cable_lateral', name: 'Cable lateral raise', muscles: 'Side delts', note: 'Constant tension' },
      { id: 'db_upright', name: 'Dumbbell upright row', muscles: 'Side delts, traps', discussed: true, note: 'Replaces barbell upright row' },
    ],
  },

  // ---------- Lower 1 ----------
  goblet_squat: {
    name: 'Goblet squat',
    muscles: 'Quads, glutes',
    pattern: 'Squat',
    sets: 3, reps: '5-8', rest: REST.heavy,
    alternatives: [
      { id: 'goblet_squat', name: 'Goblet squat', muscles: 'Quads, glutes', discussed: true, note: 'Replaces back squat, easiest to learn' },
      { id: 'db_front_squat', name: 'Dumbbell front squat', muscles: 'Quads, glutes', discussed: true, note: 'A dumbbell on each shoulder' },
      { id: 'hack_squat', name: 'Hack squat machine', muscles: 'Quads, glutes', discussed: true, note: 'When dumbbells get too light' },
      { id: 'bss_l1', name: 'Bulgarian split squat', muscles: 'Quads, glutes', discussed: true, note: '3 x 6-8 per leg' },
    ],
  },
  db_rdl: {
    name: 'Dumbbell Romanian deadlift',
    muscles: 'Hamstrings, glutes, lower back',
    pattern: 'Hip hinge',
    sets: 2, reps: '6-10', rest: REST.heavy,
    alternatives: [
      { id: 'db_rdl', name: 'Dumbbell Romanian deadlift', muscles: 'Hamstrings, glutes', discussed: true, note: 'Replaces barbell RDL' },
      { id: 'back_ext', name: '45-degree back extension', muscles: 'Hamstrings, glutes, lower back', discussed: true, note: 'Hold a dumbbell to progress' },
      { id: 'single_leg_rdl', name: 'Single-leg dumbbell RDL', muscles: 'Hamstrings, glutes', note: 'Balance demand, lighter weight' },
    ],
  },
  bss: {
    name: 'Bulgarian split squat',
    muscles: 'Quads, glutes',
    pattern: 'Single-leg squat',
    sets: 3, reps: '8-12', rest: REST.compound,
    alternatives: [
      { id: 'leg_press', name: 'Leg press (Life Fitness Optima, setting 9)', muscles: 'Quads, glutes', discussed: true, note: 'Original program slot' },
      { id: 'db_step_up', name: 'Dumbbell step-up', muscles: 'Quads, glutes', note: 'Knee-height box, easiest' },
      { id: 'bss', name: 'Bulgarian split squat', muscles: 'Quads, glutes', discussed: true, note: 'Your chosen swap' },
    ],
  },
  walking_lunge: {
    name: 'Walking dumbbell lunge',
    muscles: 'Quads, glutes',
    pattern: 'Lunge',
    sets: 3, reps: '8-12 per leg', rest: REST.compound,
    alternatives: [
      { id: 'reverse_lunge', name: 'Reverse lunge', muscles: 'Quads, glutes', note: 'Easier on the knees' },
      { id: 'walking_lunge', name: 'Walking dumbbell lunge', muscles: 'Quads, glutes', discussed: true, note: 'Program default' },
      { id: 'db_step_up_2', name: 'Dumbbell step-up', muscles: 'Quads, glutes', note: 'If lunges bother your knees' },
    ],
  },
  sl_calf: {
    name: 'Single-leg standing calf raise',
    muscles: 'Calves (gastrocnemius)',
    pattern: 'Plantar flexion',
    sets: 3, reps: '8-12', rest: REST.iso,
    alternatives: [
      { id: 'dl_calf', name: 'Double-leg dumbbell calf raise', muscles: 'Calves', discussed: true, note: 'Easiest' },
      { id: 'sl_calf', name: 'Single-leg standing calf raise', muscles: 'Calves', discussed: true, note: 'Program default' },
      { id: 'machine_calf_1', name: 'Machine calf raise', muscles: 'Calves', note: 'Heavier loading' },
    ],
  },
  captain_chair: {
    name: "Captain's chair leg raise",
    muscles: 'Lower abs, hip flexors',
    pattern: 'Hip flexion / pelvic curl',
    sets: 3, reps: '8-12', rest: REST.abs,
    alternatives: [
      { id: 'lying_leg_raise', name: 'Lying leg raise', muscles: 'Lower abs, hip flexors', note: 'Easiest, floor' },
      { id: 'captain_chair', name: "Captain's chair leg raise", muscles: 'Lower abs, hip flexors', discussed: true, note: 'Your chosen swap, bent knees first' },
      { id: 'hanging_knee_raise', name: 'Hanging knee raise', muscles: 'Lower abs, hip flexors', discussed: true, note: 'Next step up' },
      { id: 'hanging_leg_raise', name: 'Hanging leg raise', muscles: 'Lower abs, hip flexors', discussed: true, note: 'Original program slot' },
    ],
  },

  // ---------- Upper 2 ----------
  db_ohp_2: {
    name: 'Standing dumbbell overhead press (heavier)',
    muscles: 'Front and side delts, triceps',
    pattern: 'Vertical press',
    sets: 2, reps: '5-8', rest: REST.heavy,
    alternatives: [
      { id: 'machine_shoulder_press_2', name: 'Machine shoulder press', muscles: 'Front and side delts, triceps', note: 'Fixed path, easiest' },
      { id: 'seated_db_ohp_2', name: 'Seated dumbbell overhead press', muscles: 'Front and side delts, triceps', discussed: true, note: 'More stable than standing' },
      { id: 'db_ohp_2', name: 'Standing dumbbell overhead press', muscles: 'Front and side delts, triceps, core', discussed: true, note: 'Replaces barbell OHP' },
      { id: 'arnold_press_2', name: 'Arnold press', muscles: 'Front and side delts', discussed: true, note: 'Good second-day variation' },
    ],
  },
  incline_db: {
    name: 'Incline dumbbell bench press',
    muscles: 'Upper chest, front delts, triceps',
    pattern: 'Incline press',
    sets: 3, reps: '8-12', rest: REST.compound,
    alternatives: [
      { id: 'incline_machine', name: 'Incline machine press', muscles: 'Upper chest, front delts', note: 'Fixed path' },
      { id: 'incline_db', name: 'Incline dumbbell bench press', muscles: 'Upper chest, front delts, triceps', discussed: true, note: 'Program default, 30 degrees' },
      { id: 'incline_pushup', name: 'Decline push-up (feet raised)', muscles: 'Upper chest, front delts', note: 'Bodyweight option' },
    ],
  },
  chinup: {
    name: 'Chin-up (assisted if needed)',
    muscles: 'Lats, biceps',
    pattern: 'Vertical pull',
    sets: 3, reps: '6-10', rest: REST.heavy,
    alternatives: [
      { id: 'assisted_chinup', name: 'Assisted chin-up (machine or band)', muscles: 'Lats, biceps', discussed: true, note: 'Start here, reduce assistance weekly' },
      { id: 'underhand_pulldown', name: 'Underhand lat pulldown', muscles: 'Lats, biceps', note: 'Same grip, seated' },
      { id: 'chinup', name: 'Chin-up', muscles: 'Lats, biceps', discussed: true, note: 'Bodyweight' },
      { id: 'weighted_chinup', name: 'Weighted chin-up', muscles: 'Lats, biceps', discussed: true, note: 'Dumbbell between feet, original slot' },
    ],
  },
  one_arm_row_2: {
    name: 'Single-arm dumbbell row',
    muscles: 'Lats, mid back, biceps',
    pattern: 'Horizontal pull',
    sets: 2, reps: '8-12 per side', rest: REST.compound,
    alternatives: [
      { id: 'machine_row_2', name: 'Seated machine row', muscles: 'Lats, mid back', note: 'Fixed path, easiest' },
      { id: 'one_arm_row_2', name: 'Single-arm dumbbell row', muscles: 'Lats, mid back, biceps', discussed: true, note: 'Program default' },
      { id: 'cs_row_2', name: 'Chest-supported dumbbell row', muscles: 'Lats, mid back, rear delts', discussed: true, note: 'No lower back fatigue' },
    ],
  },
  incline_curl: {
    name: 'Incline dumbbell curl',
    muscles: 'Biceps (long head)',
    pattern: 'Elbow flexion',
    sets: 3, reps: '10-15', rest: REST.iso,
    alternatives: [
      { id: 'db_curl_2', name: 'Standing dumbbell curl', muscles: 'Biceps', discussed: true, note: 'Easier, no bench' },
      { id: 'incline_curl', name: 'Incline dumbbell curl', muscles: 'Biceps (long head)', discussed: true, note: 'Program default, 45-60 degrees' },
      { id: 'preacher_curl', name: 'Preacher curl (machine or dumbbell)', muscles: 'Biceps (short head)', note: 'Strict form' },
    ],
  },
  close_grip_db: {
    name: 'Close-grip dumbbell press',
    muscles: 'Triceps, chest',
    pattern: 'Horizontal press (elbows tucked)',
    sets: 3, reps: '6-10', rest: REST.compound,
    alternatives: [
      { id: 'cable_pushdown_2', name: 'Cable pushdown', muscles: 'Triceps', discussed: true, note: 'Easiest' },
      { id: 'bench_dip', name: 'Bench dip', muscles: 'Triceps, chest', discussed: true, note: 'Bodyweight, knees bent to make easier' },
      { id: 'close_grip_db', name: 'Close-grip dumbbell press', muscles: 'Triceps, chest', discussed: true, note: 'Replaces close-grip bench' },
    ],
  },
  db_lateral_2: {
    name: 'Dumbbell lateral raise',
    muscles: 'Side delts',
    pattern: 'Shoulder abduction',
    sets: 4, reps: '10-15', rest: REST.iso,
    alternatives: [
      { id: 'db_lateral_2', name: 'Dumbbell lateral raise', muscles: 'Side delts', discussed: true, note: 'Program default' },
      { id: 'cable_lateral_2', name: 'Cable lateral raise', muscles: 'Side delts', note: 'Constant tension' },
      { id: 'machine_lateral', name: 'Machine lateral raise', muscles: 'Side delts', note: 'Fixed path' },
    ],
  },

  // ---------- Lower 2 ----------
  db_deadlift: {
    name: 'Dumbbell deadlift',
    muscles: 'Glutes, hamstrings, lower back, quads',
    pattern: 'Hip hinge',
    sets: 2, reps: '5-8', rest: REST.heavy,
    alternatives: [
      { id: 'db_rdl_heavy', name: 'Heavy dumbbell RDL', muscles: 'Hamstrings, glutes', discussed: true, note: 'Simpler than from the floor' },
      { id: 'db_deadlift', name: 'Dumbbell deadlift (floor or blocks)', muscles: 'Glutes, hamstrings, lower back', discussed: true, note: 'Replaces barbell deadlift' },
      { id: 'back_ext_2', name: '45-degree back extension (weighted)', muscles: 'Glutes, hamstrings, lower back', discussed: true, note: 'When dumbbells run out' },
      { id: 'trap_bar_deadlift', name: 'Trap bar deadlift', muscles: 'Glutes, hamstrings, quads', note: 'Only if the gym has a trap bar' },
    ],
  },
  bss_2: {
    name: 'Bulgarian split squat',
    muscles: 'Quads, glutes',
    pattern: 'Single-leg squat',
    sets: 3, reps: '6-10 per leg', rest: REST.compound,
    alternatives: [
      { id: 'db_step_up_3', name: 'Dumbbell step-up', muscles: 'Quads, glutes', note: 'Easiest' },
      { id: 'goblet_squat_2', name: 'Goblet squat', muscles: 'Quads, glutes', discussed: true, note: 'Bilateral option' },
      { id: 'bss_2', name: 'Bulgarian split squat', muscles: 'Quads, glutes', discussed: true, note: 'Replaces front squat' },
    ],
  },
  leg_ext: {
    name: 'Leg extension',
    muscles: 'Quads',
    pattern: 'Knee extension',
    sets: 3, reps: '10-15', rest: REST.iso,
    alternatives: [
      { id: 'leg_ext', name: 'Leg extension', muscles: 'Quads', discussed: true, note: 'Program default' },
      { id: 'db_step_up_4', name: 'Dumbbell step-up', muscles: 'Quads, glutes', discussed: true, note: 'Fallback without machine' },
      { id: 'sissy_squat', name: 'Assisted sissy squat', muscles: 'Quads', note: 'Hold a post, bodyweight' },
    ],
  },
  leg_curl: {
    name: 'Leg curl',
    muscles: 'Hamstrings',
    pattern: 'Knee flexion',
    sets: 3, reps: '10-15', rest: REST.iso,
    alternatives: [
      { id: 'leg_curl', name: 'Leg curl (seated or lying)', muscles: 'Hamstrings', discussed: true, note: 'Program default' },
      { id: 'slider_curl', name: 'Slider or towel leg curl', muscles: 'Hamstrings', discussed: true, note: 'Fallback without machine' },
      { id: 'db_ham_curl', name: 'Dumbbell hamstring curl on bench', muscles: 'Hamstrings', discussed: true, note: 'Dumbbell between feet' },
    ],
  },
  machine_calf: {
    name: 'Machine calf raise',
    muscles: 'Calves',
    pattern: 'Plantar flexion',
    sets: 3, reps: '10-15', rest: REST.iso,
    alternatives: [
      { id: 'machine_calf', name: 'Machine calf raise', muscles: 'Calves', discussed: true, note: 'Program default' },
      { id: 'dl_calf_2', name: 'Double-leg dumbbell calf raise on step', muscles: 'Calves', discussed: true, note: 'Fallback' },
      { id: 'seated_calf', name: 'Seated calf raise', muscles: 'Calves (soleus)', note: 'Different calf muscle' },
    ],
  },
  weighted_crunch: {
    name: 'Weighted crunch',
    muscles: 'Upper abs',
    pattern: 'Spinal flexion',
    sets: 3, reps: '10-15', rest: REST.abs,
    alternatives: [
      { id: 'crunch', name: 'Bodyweight crunch', muscles: 'Upper abs', note: 'Easiest' },
      { id: 'weighted_crunch', name: 'Weighted crunch', muscles: 'Upper abs', discussed: true, note: 'Program default, dumbbell on chest' },
      { id: 'cable_crunch', name: 'Cable crunch', muscles: 'Upper abs', note: 'Kneeling, progressive loading' },
    ],
  },

  // ---------- Abs + cardio day ----------
  plank: {
    name: 'Plank',
    muscles: 'Deep core, abs',
    pattern: 'Anti-extension',
    sets: 3, reps: '30-60 s', rest: REST.abs, timed: true,
    alternatives: [
      { id: 'knee_plank', name: 'Knee plank', muscles: 'Core', note: 'Easiest' },
      { id: 'plank', name: 'Plank', muscles: 'Deep core, abs', note: 'Forearms, squeeze glutes' },
      { id: 'rkc_plank', name: 'RKC plank (max tension)', muscles: 'Core', note: 'Shorter holds, harder' },
    ],
  },
  dead_bug: {
    name: 'Dead bug',
    muscles: 'Deep core, lower abs',
    pattern: 'Anti-extension',
    sets: 3, reps: '8-12 per side', rest: REST.abs,
    alternatives: [
      { id: 'dead_bug', name: 'Dead bug', muscles: 'Deep core', note: 'Lower back stays flat' },
      { id: 'bird_dog', name: 'Bird dog', muscles: 'Core, lower back', note: 'Easier, on all fours' },
      { id: 'reverse_crunch', name: 'Reverse crunch', muscles: 'Lower abs', note: 'Pelvis curls up' },
    ],
  },
  side_plank: {
    name: 'Side plank',
    muscles: 'Obliques',
    pattern: 'Anti-lateral flexion',
    sets: 3, reps: '20-45 s per side', rest: REST.abs, timed: true,
    alternatives: [
      { id: 'knee_side_plank', name: 'Knee side plank', muscles: 'Obliques', note: 'Easiest' },
      { id: 'side_plank', name: 'Side plank', muscles: 'Obliques', note: 'Stack feet or stagger' },
      { id: 'pallof_press', name: 'Cable Pallof press', muscles: 'Obliques, deep core', note: 'Anti-rotation' },
    ],
  },
  cable_crunch_abs: {
    name: 'Cable crunch',
    muscles: 'Upper abs',
    pattern: 'Spinal flexion',
    sets: 3, reps: '12-15', rest: REST.abs,
    alternatives: [
      { id: 'crunch_abs', name: 'Bodyweight crunch', muscles: 'Upper abs', note: 'Easiest' },
      { id: 'cable_crunch_abs', name: 'Cable crunch', muscles: 'Upper abs', note: 'Kneeling, curl the spine' },
      { id: 'decline_crunch', name: 'Decline bench crunch', muscles: 'Upper abs', note: 'Hold a plate to progress' },
    ],
  },
}

// Flatten all alternative ids to a lookup with name + muscles so history can
// show the exercise that was actually done.
export const ALT_LOOKUP = {}
Object.values(EXERCISES).forEach((ex) => {
  ex.alternatives.forEach((a) => { ALT_LOOKUP[a.id] = a })
})

export const DAYS = {
  upper1: {
    key: 'upper1', label: 'Upper 1', short: 'U1', kind: 'lift',
    exercises: ['db_bench', 'db_ohp_1', 'cs_row', 'lat_pulldown', 'db_curl', 'db_skull', 'db_upright'],
  },
  lower1: {
    key: 'lower1', label: 'Lower 1', short: 'L1', kind: 'lift',
    exercises: ['goblet_squat', 'db_rdl', 'bss', 'walking_lunge', 'sl_calf', 'captain_chair'],
  },
  upper2: {
    key: 'upper2', label: 'Upper 2', short: 'U2', kind: 'lift',
    exercises: ['db_ohp_2', 'incline_db', 'chinup', 'one_arm_row_2', 'incline_curl', 'close_grip_db', 'db_lateral_2'],
  },
  lower2: {
    key: 'lower2', label: 'Lower 2', short: 'L2', kind: 'lift',
    exercises: ['db_deadlift', 'bss_2', 'leg_ext', 'leg_curl', 'machine_calf', 'weighted_crunch'],
  },
  abs: {
    key: 'abs', label: 'Abs + cardio', short: 'AB', kind: 'abs',
    exercises: ['plank', 'dead_bug', 'side_plank', 'cable_crunch_abs'],
    cardio: true,
  },
  rest: { key: 'rest', label: 'Rest', short: 'R', kind: 'rest', exercises: [] },
}

// Seven-slot cycle. Upper and lower alternate so no muscle is hit on back-to-back
// days; the mid-week rest gives 72 h before the second upper session and the
// weekend rest gives 72 h before the cycle restarts.
export const CYCLE = ['upper1', 'lower1', 'rest', 'upper2', 'lower2', 'abs', 'rest']

export const CARDIO_TYPES = ['Walk', 'Incline walk', 'Run', 'Cycling', 'Swimming', 'Badminton', 'Table tennis', 'Other']

export const restLabel = (s) => (s >= 60 ? `${Math.round(s / 60)} min` : `${s} s`)

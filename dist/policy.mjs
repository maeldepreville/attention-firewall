// Candidate parameters only. Scores are fixed illustrative estimates, not model output.
export const BASELINES = Object.freeze({ open: .58, focused: .72, protected: .86 });
export const ACTIVITIES = Object.freeze({ free: 0, deep_work: .06, meeting: .08, commuting: .02, relaxing: 0, sleeping: .10 });
export function decide(estimates, context, calibration = 0) {
  if (!(context.mode in BASELINES) || !(context.activity in ACTIVITIES) || !Number.isInteger(context.interruptions) || context.interruptions < 0 || context.interruptions > 20) throw new Error('Invalid context');
  for (const key of ['urgency', 'importance', 'interrupt_worthy']) if (!Number.isFinite(estimates[key]) || estimates[key] < 0 || estimates[key] > 1) throw new Error('Invalid estimates');
  if (!Number.isFinite(calibration)) throw new Error('Invalid calibration');
  const baseline = BASELINES[context.mode];
  const activityPressure = ACTIVITIES[context.activity];
  const interruptionPressure = Math.min(.20, context.interruptions * .016);
  const threshold = Math.max(.05, Math.min(.99, baseline + activityPressure + interruptionPressure + calibration));
  const critical = estimates.urgency >= .95 && estimates.importance >= .95;
  const action = critical || estimates.interrupt_worthy >= threshold ? 'INTERRUPT' : estimates.urgency >= .50 || estimates.importance >= .50 ? 'SILENT' : 'LATER';
  return { action, critical, baseline, activityPressure, interruptionPressure, calibration, threshold };
}

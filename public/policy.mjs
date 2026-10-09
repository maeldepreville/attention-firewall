import { POLICY } from './evaluation-config.mjs?v=28';
export const BASELINES = Object.freeze({ ...POLICY.mode_baselines });
export function decide(estimates, context, calibration = 0) {
  if (!Object.hasOwn(BASELINES, context.mode) || !Number.isInteger(context.interruptions) || context.interruptions < 0 || context.interruptions > 20 || !Number.isFinite(calibration)) throw new Error('Invalid policy context');
  const baseline = BASELINES[context.mode];
  const interruptionPressure = Math.min(POLICY.maximum_pressure, context.interruptions * POLICY.pressure_per_interruption);
  const threshold = Math.max(POLICY.threshold_bounds[0], Math.min(POLICY.threshold_bounds[1], baseline + interruptionPressure + calibration));
  if (estimates === null) return { action: 'SILENT', critical: null, threshold: null, baseline, interruptionPressure, calibration, reason: 'MODEL_UNAVAILABLE' };
  for (const key of ['urgency', 'importance', 'interrupt_worthy']) if (!Number.isFinite(estimates[key]) || estimates[key] < 0 || estimates[key] > 1) throw new Error('Invalid estimates');
  const critical = estimates.urgency >= POLICY.critical_urgency_threshold && estimates.importance >= POLICY.critical_importance_threshold;
  const action = critical || estimates.interrupt_worthy >= threshold ? 'INTERRUPT' : Math.max(estimates.urgency, estimates.importance) >= POLICY.quiet_severity_threshold ? 'SILENT' : 'LATER';
  const reason = critical ? 'CRITICAL_OVERRIDE' : action === 'INTERRUPT' ? 'THRESHOLD_MET' : action === 'SILENT' ? 'USEFUL_QUIETLY' : 'LOW_IMMEDIATE_VALUE';
  return { action, critical, threshold, baseline, interruptionPressure, calibration, reason };
}

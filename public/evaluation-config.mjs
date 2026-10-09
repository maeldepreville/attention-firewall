// Exact evaluated af-eval-0.2 policy payload. Do not tune against the final test.
export const POLICY = Object.freeze({
  "policy_version": "af-policy-0.3-dev",
  "mode_baselines": {
    "open": 0.58,
    "focused": 0.72,
    "protected": 0.86
  },
  "pressure_per_interruption": 0.016,
  "maximum_pressure": 0.2,
  "threshold_bounds": [
    0.05,
    0.99
  ],
  "category_adjustment_primary": 0,
  "quiet_severity_threshold": 0.3333333333333333,
  "critical_condition": "urgency >= 0.75 AND importance >= 0.95",
  "branch_order": [
    "critical_INTERRUPT",
    "interrupt_worthy >= threshold: INTERRUPT",
    "urgency >= 0.50 OR importance >= 0.50: SILENT",
    "otherwise: LATER"
  ],
  "comparisons": "inclusive",
  "interruption_basis": "session",
  "ordinal_normalization": "sum(level_index * level_probability) / 3",
  "probability_sum_tolerance": 0.001,
  "failure_action": "SILENT",
  "failure_estimates": null,
  "failure_critical": null,
  "critical_urgency_threshold": 0.75,
  "critical_importance_threshold": 0.95
});

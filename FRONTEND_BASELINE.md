# Attention Firewall — approved frontend baseline

Approved by the user on 2026-10-08 at Site version 24. The user then authorized removing the candidate label and synchronizing the complete frontend to `maeldepreville/attention-firewall`, branch `main`. Site version 25 contains that label cleanup. This document describes current behavior; `CANDIDATE.md` is historical.

## Approved visual direction

Apple-inspired light appearance with porcelain surfaces, neutral borders, system typography, locally hosted authentic app icons, and restrained motion. The primary surface is a notification experiment, with a three-card irregular queue and Send notification button at the top left, the compact attention picker at the top right, and the central decision/notification panel below.

The outcome cards share a soft radial gradient. Standard Interrupt has a localized charcoal cloud fading into silver; Silent is cloudy cream/silver; Later uses muted amber; critical Interrupt uses muted red. Only the critical exception has a CRITICAL badge. The assessment loader has a dark charcoal core and neutral dark pulse halo for contrast on the light panel.

Exact scores and thresholds remain in the expanded Why this decision? technical details. The main control offers Open, Focused, and Protected, defaulting to Open. Activity is not a visible control.

## Initial state and interaction

- Each launch starts without a notification or decision. The center prompts Send your first notification and directs the user to Send notification above. Attention changes preserve this empty state.
- The front queued event is the event delivered by the next send. There are eight curated examples across six semantic categories.
- Sending preserves the selected attention mode. The outgoing card retains its content throughout departure, and the same event appears in the center. The queue loops after the eighth example.
- The central panel reserves its height; feedback space stays reserved but invisible and inert before a decision. Explanations are closed for each send.
- Sending is locked during departure and assessment. Attention changes during those phases do not skip or duplicate the event.
- Feedback offers Right call or a contextual correction, with Undo. Corrections transparently alter category-level calibration for the current page session. Disagreement with a critical outcome records feedback without disabling the critical guardrail.
- State and calibration are session-only and reset on reload. There is no persistence, account, model API, or native notification delivery.

## Motion contract

| Phase | Behavior |
| --- | --- |
| Departure | 440 ms cubic Bézier sweep right then down; rotation follows the tangent relative to the original card angle; slight expansion, increasing blur, and fade |
| Queue promotion | 420 ms movement from the previous second/third card positions; the replacement rear card fades in |
| Center arrival | 680 ms gentle fade and settle, starting 18 px above at scale 0.985 with 1.5 px blur; no overshoot |
| Assessment | Existing simulated 1,350 ms wait starts on receipt, with a 1.2 s repeating pulse until the outcome |
| Decision reveal | Brief 250 ms arrival and sheen, with slight dimming of the notification |

The curved departure scales with actual card width and uses 25 sampled keyframes. Pointer, touch, and keyboard use the same flow. Reduced motion substitutes 100–120 ms opacity-only changes and disables the pulse and decision sheen. Missing or canceled animation support still delivers once. Completed animations release their fill styles.

## Current deterministic policy

`dist/app.js` contains fixed illustrative estimates. `dist/policy.mjs` owns the decision function. Category describes semantic context and does not directly select an action.

- Baselines: Open 0.58, Focused 0.72, Protected 0.86.
- Recent interruption pressure: `min(0.20, interruptions * 0.016)`, with a session counter capped at 20. This is a simulated recent-load counter, not an actual rolling-hour measurement.
- The demo passes `activity: free`, so activity pressure is zero. The policy module defines other activity mappings for potential later use; the UI does not expose them.
- Threshold: baseline + interruption pressure + activity pressure + category calibration, clamped to [0.05, 0.99].
- Critical override: both urgency and importance >= 0.95, regardless of threshold.
- Otherwise, interrupt-worthiness >= threshold gives INTERRUPT; urgency or importance >= 0.50 gives SILENT; otherwise LATER.
- Advancing from an INTERRUPT outcome increments pressure. The first send starts at zero; no event is counted before it has been sent.
- Mode changes reevaluate the current event without changing its semantic estimates.

The WebMCP `set_attention_mode` tool shares the visible control path. It returns a waiting state without inventing a notification before the first send, and reports sending/processing/ready states thereafter. It is optional browser enhancement and does not constitute a backend MCP server.

## Validation and limitations

`node scripts/verify-frontend.mjs` passes four motion/state scenarios (normal, reduced motion, unsupported animation, and canceled departure), with nine sends each. It checks content identity, ordering, duplicate-send guards, mode changes, calibration/Undo, policy outcomes, critical override, full queue looping, and animation cleanup. Geometry checks at 150, 158, and 196 px confirm right/down curvature, tangent rotation, progressive blur/fade, and no initial rotation jump.

Visual browser rendering was unavailable during these updates. The user reviewed and approved the deployed frontend; automated browser QA is not claimed. All estimates, latency, and calibration are simulated. The 150–250-scenario evaluation dataset, model adapters, comparisons, and measured metrics from the project brief are not implemented yet.

## Continuing the project

Preserve this approved frontend while deriving future model and policy contracts. Keep probabilistic estimation separate from deterministic control, maintain the existing experiment exclusions, and do not expand infrastructure or connect a model until requested. GitHub synchronization requires explicit user validation or instruction; never force-push.

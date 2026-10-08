# Attention Firewall — frontend design history

Status: frontend approved by the user on 2026-10-08 (Site version 24). Version 25 removes the candidate footer label and page-title suffix. Current behavior is documented in FRONTEND_BASELINE.md; this file records past iterations.

## Direction

The user rejected candidates 01 and 02 as generic and requested a premium, creative Apple-app feel, the notification design at https://codepen.io/gabriellewee/pen/MXyKLW, a compact attention control without a slider, the curved hand-drawn arrow from their sketch, an irregular pile of notifications, and authentic app icons.

This candidate translates the established composition into a restrained Apple-inspired light appearance: a cool white canvas, layered porcelain surfaces, fine neutral borders, subtle system-blue accents, and system typography. The hand-drawn arrow annotation was removed after review. Sending advances to a 1,350 ms simulated engine wait. A single softly illuminated silver point sends out a restrained, repeating halo in the decision band with concise status copy; the light-theme pulse has no progress or completion cue. The wait is a placeholder for future model latency. The main notification follows the reference's hierarchy: app icon and uppercase app name with a timestamp in the header, then sender and message below. Source code is original; the reference's legacy animation stack and long transition are not copied.

Desktop: irregular queue and Send notification at top left, native attention picker top right; engine action above the notification; Why this decision? at the panel's bottom right; feedback underneath. Mobile retains this arrangement with smaller queue previews and a compact attention picker. The send button uses the supplied transparent paper-plane image at a crisp, compact size. The external arrow annotation and queue counter are omitted to keep the action area focused. The engine outcome appears in an elevated, outcome-tinted card with a large title, a CRITICAL badge only for the critical attention exception, a brief sheen and settle, and a short dim of the notification beneath it. The decision area reserves space during processing to avoid shifting the notification.

## Retained product behavior

- Open remains the initial default; the compact custom frosted picker offers Open, Focused, and Protected.
- Sending preserves the selected mode. Mode changes re-evaluate the current notification without changing semantic estimates.
- Eight simulated examples span six semantic categories. Apple Messages, Mail, and Wallet use their authentic App Store icons. Teams and Instagram use their authentic company App Store icons. The icons are hosted locally and resolved from the page URL. Source URLs are in ASSET_SOURCES.json. The notification pile previews the next three examples and advances with the queue.
- Current activity is not a control or an input to demo decisions: the internal activity remains free, with zero activity pressure.
- Recent interruptions count simulated INTERRUPT outcomes when advancing, up to 20. Categories remain semantic context rather than direct action rules.
- Feedback demonstrates transparent category-level session calibration with Undo. Critical disagreement does not disable the critical guardrail.
- Main card contains no raw numeric threshold. Semantic estimates and policy details are progressively disclosed.
- No model, API, native notification integration, account, or database is connected. All scores and calibration are illustrative.

## Policy parameters

Mode baselines: Open 0.58, Focused 0.72, Protected 0.86. Recent pressure: min(0.20, interruptions × 0.016). Effective threshold: clamp(baseline + recent pressure + session calibration, 0.05, 0.99). Critical override requires both urgency and importance >= 0.95. Otherwise interrupt-worthiness meeting the threshold produces INTERRUPT; urgency or importance >= 0.50 produces SILENT; other events produce LATER. The report scenario has interrupt-worthiness 0.70.

## Craft and accessibility

Emil Kowalski's emil-design-eng, apple-design, mobile-native, and animate skills remain the design principles. The decision reveal uses the shared strong ease-out, transform and opacity for arrival, and a single 250 ms CSS sheen using the shared ease-in-out token. The indeterminate animation remains active until the engine responds; the current 1,350 ms simulated wait will be replaced with the model promise. No animation library or new dependency was added. Keyboard-triggered sending skips motion. Reduced motion removes the travel and sheen while keeping a short opacity cue. Hover is pointer-gated. The custom attention picker supports touch, pointer, and keyboard navigation. Safe areas, dynamic viewport height, preserved zoom, reduced-motion, reduced-transparency, and increased-contrast variants are implemented.

WebMCP set_attention_mode shares the visible attention picker's state update path. The custom list supports pointer, touch, and keyboard operation. It is progressive enhancement only.

## Validation

JavaScript syntax and a DOM harness check the custom picker, simulated loading and completion, mode persistence, all outcomes, fixed semantic scores across modes, feedback and Undo, critical exception, example loop, guarded WebMCP inputs, and icon paths. Visual browser rendering remains unverified: local Chromium is unavailable, and the owner-only cloud page requires authentication. No browser QA is claimed.

The user explicitly approved the frontend and requested GitHub synchronization on 2026-10-08. Preserve the approved baseline documented in FRONTEND_BASELINE.md.


## Candidate 20 — cold start and standard interrupt gradient

- Standard INTERRUPT uses the same radial gradient as CRITICAL: a localized charcoal cloud fading into a porcelain silver surface, with charcoal text for contrast. The separate full-card dark gradient is removed. Other outcomes retain their palette.
- Every page launch starts with no current notification, decision, explanation, feedback, or interruption pressure. The central panel prompts the user to use Send notification above. The first queue item is Alex's Messages notification; the first send delivers that exact item and starts the existing simulated assessment.
- Attention mode changes before the first send preserve the empty state. WebMCP returns a waiting state without inventing a notification or decision. After sending, the existing queue, policy, feedback, and critical override behavior continue.

Validation: DOM harness passed empty launch, attention changes before sending, first queue/send alignment, simulated assessment, interruption pressure, all outcomes, calibration/Undo, critical override, queue loop, and shared gradient styling. Browser rendering was not available for this static candidate.


## Candidate 21 — connected sending and receiving

Reference: https://codepen.io/jkantner/pen/KwwLRPm (Jonathan Kantner, Notification Feed Animations). Original adaptation of the departure blur/scale/fade; no copied React, faker, or FLIP dependencies.

- Sending holds the queued event's content for a 360 ms upward lift, slight expansion, and softened fade. The prior received card or cold-start prompt leaves during this phase.
- Only after departure does the event advance once. The existing second and third previews promote through their physical positions over 420 ms; the new rear card fades into the pile.
- The identical event arrives in the center over 560 ms, moving down from above with a small scale change, light blur, and restrained settle. The 1,350 ms assessment starts on receipt; its result reveal remains separate.
- Pointer, touch, and keyboard share this sequence. Reduced motion substitutes short opacity fades without movement, scaling, blur, or spring. Unsupported/canceled animation falls back to delivery.
- Send is locked during departure and assessment. Attention changes during either phase preserve the event and animation; feedback stays unavailable until a decision. The central panel keeps a minimum height to avoid moving the stage during the handoff.

Validation: four DOM/animation scenarios (normal, reduced motion, no WAAPI, and canceled departure) passed nine sends each. Checks cover untouched departing content, physical queue promotion origins, identical queue/received event, rapid-click guards during sending and assessment, attention changes mid-handoff, result timing, calibration/Undo, critical override, full loop, and releasing animation fill styles. Browser rendering remains unavailable in this environment; no visual browser QA is claimed.


## Candidate 22 — curved departure from the supplied sketch

The queued card now sweeps right before bending down over 440 ms. A cubic Bézier path is sampled into 25 animation keyframes; the card's additional rotation follows the path tangent relative to its original resting angle, avoiding a snap at departure. Travel scales with actual card width. The existing expansion, progressive blur, and fade remain, with enough opacity through the bend to read the curved movement. Receiving, queue promotion, locking, and the reduced-motion opacity-only alternative retain their behavior.

Validation: the four existing motion/state scenarios passed again. Geometry checks at 150, 158, and 196 px confirm a continuous rightward path bending downward, increasing tangent rotation, zero initial angle jump, and progressive blur/fade. Visual browser QA remains unavailable.


## Candidate 23 — softer central notification arrival

Receiving now eases in and settles over 680 ms with 18 px of travel, a subtle 0.985 starting scale, and 1.5 px of initial blur. The former overshoot is removed. One continuous interpolation uses a gentler starting slope, spreading the fade over the entrance instead of making the notification appear almost immediately. The curved departure, queue promotion, assessment timing, and reduced-motion fade are preserved.

Validation: existing motion/state and curved-departure geometry checks passed after the arrival adjustment. Browser rendering remains unverified.


## Candidate 24 — charcoal assessment pulse

The assessment loader now uses a dark charcoal core and a matching neutral dark halo, improving visibility against the porcelain panel. Its size, pulse radius, cadence, reduced-motion behavior, and assessment text are preserved. The final light-theme CSS declarations were checked; browser rendering remains unverified.

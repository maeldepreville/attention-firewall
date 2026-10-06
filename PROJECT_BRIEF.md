# Attention Firewall — Project Brief & Handoff

> **Status:** agreed project definition, pre-implementation  
> **Repository:** `maeldepreville/attention-firewall`  
> **Working principle:** design first; implementation follows the validated interaction and visual design.  
> **Repository rule:** implementations and material project changes are synchronized to this repository only after explicit user validation or an explicit request to synchronize.

---

## 1. Project intent

**Attention Firewall** is a small-to-medium AI engineering experiment around a simple question:

> **Given a notification and a small amount of contextual information, can a decision model make a useful interruption decision better than simple rules, while remaining fast and explainable enough for a real-time decision path?**

The project is deliberately **not** intended, at this stage, to become a production-ready notification application, operating-system integration, mobile app, or full personal assistant.

The purpose is to build a credible, visually strong, technically rigorous experiment around decision models and contextual attention management.

The project should remain understandable at three levels:

- **Human/product level:** not every notification deserves attention at the moment it arrives.
- **Engineering level:** a probabilistic model can estimate the situation while a deterministic policy retains control of the final action.
- **AI level:** some AI problems require bounded decisions rather than generated language.

The experiment must stay narrow enough to finish cleanly.

---

## 2. Core product idea

Current notification systems commonly operate at the application level:

```text
This app may notify me / this app may not notify me
```

But the useful decision is contextual:

> **Does this particular event deserve to interrupt the user right now?**

The same application can produce radically different events:

- a casual social message;
- someone waiting outside;
- a security alert;
- a delivery arriving;
- promotional content;
- an urgent work incident.

Attention Firewall treats each notification as an individual decision.

### Initial final outcomes

For the first experiment, the final policy outputs are:

- `INTERRUPT`
- `SILENT`
- `LATER`

`IGNORE` is intentionally excluded from V0.1 because discarding information introduces a qualitatively different and riskier decision. The first experiment should prove interruption management, not automatic deletion.

---

## 3. Fundamental architecture principle

The most important architectural principle is:

> **Probabilistic understanding, deterministic control.**

The decision model should **not directly own the system action**.

Instead:

```text
Notification + context
        │
        ▼
Decision model
        │
        ├─ urgency
        ├─ importance
        └─ interrupt-worthiness
        │
        ▼
Deterministic policy
        │
        ├─ INTERRUPT
        ├─ SILENT
        └─ LATER
```

The model estimates the situation.

The policy decides what the system is allowed to do.

This separation must remain explicit in both the implementation and the interface.

---

## 4. Decision-model contract

The first version should keep the model contract intentionally small.

Given a notification and its context, the model should answer three bounded questions:

### 4.1 Urgency

How time-sensitive is this notification?

Example representation:

```text
urgency = 0.94
```

### 4.2 Importance

How costly would it be for the user to miss or delay this information?

Example:

```text
importance = 0.82
```

### 4.3 Interrupt-worthiness

Should this notification interrupt the user now?

Example:

```text
interrupt_worthy = 0.91
```

The exact question types and scales can be refined during implementation according to the selected model API, but the conceptual contract should remain stable.

The primary model candidate is **Cloudflare Clef-flash** because the use case is latency-sensitive.

Potential comparison models:

- Clef
- Jev

A conventional generative LLM may later be added as an optional comparison baseline, but it is **not required for the MVP**.

---

## 5. Minimal context

Do not feed the system every possible personal signal.

The first experiment should use only a small amount of context sufficient to create meaningful conflicts.

Recommended V0.1 state:

```json
{
  "notification": {
    "source": "messaging",
    "sender_relationship": "close_friend",
    "text": "I'm downstairs"
  },
  "context": {
    "activity": "deep_work",
    "local_time": "19:42",
    "interruptions_last_hour": 5
  }
}
```

### Notification fields

- source/application category
- sender relationship
- notification text

### Context fields

- current activity
- local time / day context
- interruptions during a recent window

Potential activities:

- deep work
- meeting
- commuting
- relaxing
- sleeping
- free / idle

Avoid unnecessary context unless the experiment demonstrates that it is required.

In particular, V0.1 does **not** require:

- GPS/location
- smartwatch data
- full calendar integration
- message history
- contact history
- device telemetry
- browsing history
- sleep tracking

---

## 6. Attention budget

The attention budget is a core differentiator and should exist in V0.1.

However, it should remain deterministic and simple.

The preferred interpretation is **a dynamic interruption threshold**, rather than a gamified point balance.

Example:

```text
0 recent interruptions  → threshold = 0.60
3 recent interruptions  → threshold = 0.72
7 recent interruptions  → threshold = 0.86
```

If the model returns:

```text
interrupt_worthy = 0.78
```

then:

```text
threshold = 0.65
→ INTERRUPT
```

but later:

```text
threshold = 0.84
→ SILENT
```

This creates an important property:

> **The same notification can lead to a different final action because the user's attention state changed, without changing the model's semantic evaluation.**

That separation is important to preserve.

---

## 7. Personalization

V0.1 should demonstrate personalization without requiring training or fine-tuning.

The interface may expose lightweight corrections such as:

- **Should have interrupted me**
- **Shouldn't have interrupted me**

These corrections can initially modify a transparent calibration layer.

Example:

```text
model interrupt probability  = 0.74
personal social adjustment   = -0.08
-----------------------------------
effective probability        = 0.66
```

The goal is not to build a sophisticated recommendation engine.

The goal is to show how very lightweight feedback could alter the decision policy over time.

Model fine-tuning is an optional later exploration, not part of the initial scope.

---

## 8. Evaluation dataset

The project must include a real evaluation dataset so that it is more than a UI demonstration.

Target size:

> **approximately 150–250 manually constructed and labelled notification scenarios**

The dataset should cover several families.

### Suggested categories

- messaging
- work
- security / finance
- logistics / transport
- social
- commercial / promotional

### Scenarios should vary context

For example:

- current activity
- time
- relationship to sender
- recent interruption load

Useful ambiguous examples include:

- close family member, low urgency;
- unknown service, high urgency;
- apparent urgency created by marketing;
- important event during deep work;
- same event under two different user contexts.

### Labels

Each scenario should receive a final target label:

- `INTERRUPT`
- `SILENT`
- `LATER`

Optionally also record human labels for:

- urgency
- importance

These auxiliary labels can help evaluate the model contract independently of the final policy.

---

## 9. Required baselines

The decision model must not be evaluated in isolation.

At least three systems should be compared.

### Baseline A — application/category rules

A deliberately simple representation of traditional notification settings.

Example:

```text
messaging → INTERRUPT
security  → INTERRUPT
social    → LATER
marketing → LATER
```

### Baseline B — contextual deterministic rules

A stronger handcrafted baseline.

Example:

```text
if category == security:
    INTERRUPT

elif activity == meeting:
    SILENT

elif sender_relationship == close_family:
    INTERRUPT
```

This baseline is important: the decision model should not only be compared with a strawman.

### System C — decision model

Primary candidate:

- Clef-flash

Possible comparison:

- Clef
- Jev

### Optional System D — generative model

A small generative LLM may later be asked to choose among the same bounded alternatives.

This comparison is optional and should only be added if it materially improves the experiment.

---

## 10. Evaluation metrics

Do not rely on accuracy alone.

### Standard metrics

- accuracy
- macro-F1
- confusion matrix
- latency

### Attention-specific weighted cost

Mistakes have different consequences.

For example:

```text
unnecessary interruption          → cost 1
important notification delayed    → cost 2
critical notification delayed     → cost 5
```

Then compute a weighted **interruption cost** over the evaluation set.

The exact weights must be documented and can be refined, but they should remain deterministic and understandable.

### Calibration

Confidence matters because the policy uses thresholds.

The experiment should therefore evaluate whether probabilities are reasonably calibrated.

Possible bins:

```text
0.50–0.60
0.60–0.70
0.70–0.80
0.80–0.90
0.90–1.00
```

Compare predicted confidence with empirical correctness.

Calibration may ultimately matter more than raw accuracy for threshold-based decisions.

---

## 11. Design-first implementation philosophy

The user is explicitly **design first**.

The interface should be designed and validated before implementing unnecessary backend or model infrastructure.

The working order is:

1. define the central visual object;
2. define its states;
3. define the demo flow;
4. define the minimal surrounding interface;
5. derive the data contract from the validated UI;
6. only then implement the required system.

The UI becomes a practical contract for the backend.

---

## 12. Visual philosophy

The central design object should be **a notification-like component**, not a SaaS dashboard.

The experiment should feel:

- compact;
- calm;
- precise;
- native-like;
- information-dense without being busy;
- visually credible enough that a screenshot can communicate the concept without extensive explanation.

Avoid:

- dashboard sidebars;
- KPI grids;
- generic AI gradients;
- glowing AI orbs;
- chat interfaces;
- excessive charts;
- startup-style marketing pages;
- unnecessary visual complexity.

A guiding principle:

> **Small model, small interface, small decision, potentially meaningful effect.**

The demo should look like a system component or experimental interface, not like a fictional finished consumer product.

---

## 13. Central notification component

The first real design task is the notification component itself.

A rough information hierarchy:

```text
╭──────────────────────────────────╮
│ WhatsApp                     now │
│                                  │
│ Alex                             │
│ I'm downstairs                   │
│                                  │
│ INTERRUPT                  91%   │
│                                  │
│ urgency                    94%   │
│ importance                 82%   │
│                                  │
│ Attention threshold        76%   │
│                                  │
│ Why this decision?               │
╰──────────────────────────────────╯
```

This is **not a final design**. It only captures the required information.

When expanded, the component should make the architecture legible:

```text
Decision

Model
interrupt-worthy           0.91
urgency                    0.94
importance                 0.82

Policy
current threshold          0.76

Result
INTERRUPT
```

The design should make clear that:

- the model produced estimates;
- the policy applied a threshold;
- the final action followed from the policy.

---

## 14. Required interaction states

Before building the full interface, design at least these states:

1. incoming notification;
2. final `INTERRUPT`;
3. final `SILENT`;
4. final `LATER`;
5. expanded **Why this decision?** state;
6. feedback state;
7. attention threshold change after repeated interruptions.

Animations and micro-interactions should remain restrained and functional.

The interface should feel closer to a notification than to a web application.

---

## 15. Demo narrative

The demo should not merely allow random scenario selection.

It should contain a carefully curated sequence that teaches the concept through interaction.

Suggested progression:

### Scenario 1 — obvious interrupt

A highly time-sensitive event.

Purpose: establish the mechanism.

### Scenario 2 — obvious non-interrupt

A low-value social or promotional event.

Purpose: establish contrast.

### Scenario 3 — ambiguous event

A case where source alone is insufficient.

Purpose: show the value of contextual evaluation.

### Scenario 4 — same notification, different context

Purpose: demonstrate contextual decisions.

### Scenario 5 — same semantic evaluation, higher attention threshold

Purpose: demonstrate the attention budget.

### Scenario 6 — user correction

Purpose: demonstrate lightweight personalization.

A person should understand the project by going through this sequence without needing a long explanation.

---

## 16. Initial technical shape

Do not lock the stack until the validated design establishes what is required.

A likely lightweight architecture is:

```text
Frontend
   │
   ▼
Small API
   │
   ├── Decision model adapter
   │      ├─ Clef-flash
   │      ├─ Clef
   │      └─ Jev
   │
   ├── Policy engine
   │
   └── Scenario dataset / evaluation utilities
```

The scenario dataset can begin as a local JSON/CSV file.

There is no need for production infrastructure at this stage.

---

## 17. Explicitly out of scope for V0.1

Do **not** implement these unless the project is deliberately expanded later:

- native mobile application;
- Android notification listener;
- iOS notification integration;
- browser extension;
- real notification suppression;
- authentication;
- user account system;
- production database;
- calendar integration;
- GPS/location integration;
- full message history;
- vector database;
- RAG;
- autonomous agent;
- complex background workers;
- model fine-tuning;
- elaborate analytics dashboard.

These features would distract from the central experiment.

---

## 18. Definition of the smallest credible experiment

Attention Firewall V0.1 is:

> **A controlled experiment evaluating whether a fast decision model can contextually determine when a simulated notification deserves to interrupt a user, compared with traditional rule-based approaches.**

Minimum intended deliverables:

1. approximately 150–250 labelled notification/context scenarios;
2. application/category-rule baseline;
3. contextual deterministic-rule baseline;
4. Clef-flash decision implementation;
5. Clef and/or Jev comparison;
6. accuracy, macro-F1, weighted interruption cost, and latency evaluation;
7. basic probability calibration analysis;
8. dynamic attention threshold;
9. minimal interactive notification-like demo;
10. lightweight feedback/personalization demonstration.

A negative result is acceptable.

If handcrafted rules outperform the decision model, the project should report that honestly. The project is an experiment, not a predetermined model showcase.

---

## 19. Current project phase

**Current phase: visual and interaction design.**

The next task is **not model integration**.

The next task is to design the central notification component and its states until the visual language is convincing.

Once the component is validated:

1. design the complete curated demo flow;
2. define the minimal page/frame around it;
3. derive the exact frontend data model;
4. derive the model/policy API contract;
5. implement only what the validated design requires.

---

## 20. Repository working rules

This repository is the persistent source of truth for the implementation project.

### Synchronization

Do not synchronize implementation changes automatically.

Repository changes should be pushed only:

- after explicit user validation; or
- after an explicit user request to synchronize/publish the current state.

### Documentation

Important product, design, architecture, evaluation, or workflow decisions should be recorded in the repository so that a new working session can reconstruct the project without relying on chat history.

### Scope control

Before adding a feature, ask:

> Does this help prove the central experiment or make the demo meaningfully clearer?

If not, defer it.

### Design before infrastructure

Do not introduce infrastructure merely because it may be useful later.

Implementation should follow the validated product/design contract.

---

## 21. Handoff instructions for a new working session

A new agent/chat taking over this project should:

1. read this document first;
2. inspect the current repository state before modifying anything;
3. preserve the agreed experiment scope;
4. remain design-first;
5. avoid expanding into a production notification application;
6. keep the model/policy separation explicit;
7. treat the attention threshold as a core feature;
8. favor restrained, notification-like interaction design;
9. document material decisions;
10. never synchronize implementation changes without explicit user validation or instruction.

The immediate next deliverable should be a **visual candidate for the central notification component and its interaction states**, not backend code.

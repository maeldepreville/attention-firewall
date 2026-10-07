# Attention Firewall — agent instructions

## Start here

- Read `PROJECT_BRIEF.md` in full before making product, UX, architecture, or implementation decisions. It is the source of truth for the experiment.
- Inspect the repository state before changing anything: current branch, existing files, manifests, lockfiles, and pending changes.
- Preserve existing user work. Do not overwrite, revert, or restructure unrelated changes.
- The project is currently **design first**. Do not add infrastructure, dependencies, model integration, or backend complexity before the relevant interaction/design direction is validated.

## Product invariants

- Attention Firewall is a focused experiment in contextual interruption decisions, not a production notification app, OS integration, or general assistant.
- Keep the core separation explicit:
  - the **decision model** estimates `urgency`, `importance`, and `interrupt_worthy`;
  - a **deterministic policy** selects `INTERRUPT`, `SILENT`, or `LATER`.
- Notification categories are **semantic context**, not direct action rules.
- The user-facing attention modes are:
  - `Open`
  - `Focused`
  - `Protected`
- `Open` is the default mode.
- The exact interruption threshold is an internal implementation detail. Do not expose it as a primary user setting.
- Context such as recent interruptions and current activity may adjust the effective threshold deterministically.
- `Protected` is not equivalent to Do Not Disturb: highly justified events may still interrupt.
- Critical overrides must remain narrow, explicit, deterministic, and testable.
- Keep simulated scores and behavior clearly identified as simulated until real model integration exists.
- Preserve the exclusions and scope boundaries defined in `PROJECT_BRIEF.md`.

## Design and interaction rules

- The core interface should feel closer to a **notification/system component** than to a dashboard or SaaS product.
- Favor:
  - compact layouts;
  - restrained visual hierarchy;
  - calm, precise interaction;
  - native-like notification behavior;
  - minimal but meaningful motion.
- Avoid:
  - dashboard sidebars;
  - KPI grids;
  - generic AI gradients or glows;
  - chat-style interfaces;
  - unnecessary charts;
  - startup-style marketing framing.
- Treat exact visual choices such as palette, typography, spacing, motion, and platform influence as **design decisions to validate**, not permanent assumptions.
- Present reviewable visual/interaction candidates before integrating a direction.
- Variants should differ meaningfully in hierarchy, density, layout, or interaction model—not merely by color.
- The main notification card should prioritize the human-facing state first; exact model scores and threshold details belong in deeper technical explanation states.

## Implementation discipline

- Build only what the validated design requires.
- Derive the frontend data model and API contract from the validated interaction states.
- Keep dependencies and infrastructure minimal.
- Do not introduce authentication, production databases, background workers, notification listeners, RAG, vector stores, fine-tuning, or other out-of-scope systems unless the project scope is explicitly expanded.
- When implementation exists, run the relevant validation commands that are actually available.
- Never claim a test, browser check, model call, latency measurement, or visual verification that was not performed.
- If a required check is unavailable, state that plainly.

## Workflow

1. Read `PROJECT_BRIEF.md`.
2. Inspect the current repository state.
3. Identify the current project phase and validated decisions.
4. For design work, produce a reviewable candidate before implementation.
5. After validation, implement only the required behavior.
6. Run relevant checks.
7. Summarize:
   - files changed;
   - behavior implemented;
   - validation performed;
   - remaining decisions or limitations.

## Git and synchronization

- Do not commit, push, publish, merge, or otherwise synchronize project changes to GitHub until the user explicitly validates those changes or explicitly asks to synchronize/publish them.
- Never force-push.
- Preserve existing branches and user changes unless explicitly instructed otherwise.
- Important product, UX, architecture, evaluation, or workflow decisions should be reflected in repository documentation so a new session can reconstruct the project without relying on chat history.

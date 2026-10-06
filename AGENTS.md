# Attention Firewall — project instructions

## Start every task here

- Read `PROJECT_BRIEF.md` in full before making project decisions. It is the source of truth for scope, architecture, and the experiment.
- Inspect the task's checkout before acting: confirm the repository root, current branch, and `git status --short --untracked-files=all`. Preserve existing changes.
- Use the checkout supplied by the task. In the current Codex Cloud setup, `/workspace/attention-firewall` is the expected path; verify it rather than assuming. Cloud tasks are already isolated, so do not create a Git worktree unless the user asks.
- The project is currently in visual and interaction design. The repository has no application runtime or established test suite unless inspection shows it has changed. Do not choose a stack, add dependencies, or create infrastructure before the user validates the design.

## Product invariants

- Attention Firewall is a focused experiment in contextual interruption decisions, not a production notification app, operating-system integration, or general assistant.
- Keep the separation visible: the model estimates urgency, importance, and interrupt-worthiness; a deterministic policy selects `INTERRUPT`, `SILENT`, or `LATER`.
- The attention threshold is central. The same event may receive a different policy outcome as context or the threshold changes, while its model estimates remain fixed.
- Treat rules in an unvalidated visual candidate as provisional. In particular, do not treat candidate thresholds or urgency/importance cutoffs as settled product policy until the user validates them.
- Keep model scores in prototypes clearly identified as simulated. Do not imply that a model, backend, or notification integration is running when it is not.
- Preserve the brief's exclusions and keep each addition tied to proving the experiment or clarifying its demo.

## Visual and interaction direction

- Follow the user's visual direction: minimalist, sleek, clean-lined, Apple-inspired, and close to a notification window or notification page. Use matte black, white, and neutral grays. Avoid bright colors, AI gradients or glows, and dashboard-like framing.
- For visual work, read the relevant current skills from `https://github.com/emilkowalski/skills`: at minimum `skills/prototype/SKILL.md`, `skills/apple-design/SKILL.md`, and `skills/emil-design-eng/SKILL.md`. For mobile work, also read `skills/mobile-native/SKILL.md`. If the prototype workflow is used, consult its `PICKER.md` and follow its picker requirements.
- Apply those skills in service of the user's direction; generic skill defaults do not override the project's palette, notification-first composition, or validated decisions. If a skill source cannot be accessed, say so and do not claim to have read it.
- Design interaction and visual treatment together. Keep motion restrained, responsive, interruptible where appropriate, and respectful of reduced-motion preferences. Make controls functional in a prototype; label simulated behavior honestly.
- When exploring, make variants meaningfully different by layout, density, hierarchy, or interaction model—not merely by color. Keep exploration separate from production code until the user selects a direction.

## Workflow and validation

1. Establish repository state and relevant instructions before changing files.
2. For design work, present a reviewable candidate and explain its interactions and any provisional decisions. Do not integrate a direction before the user chooses or approves it.
3. Before implementation, inspect the project's current manifests, lockfiles, and source structure. Add only the runtime and checks required by the validated design.
4. Run existing, relevant validation commands when implementation exists. Never invent test results or claim visual/browser verification that was not actually performed; state any unavailable check plainly.
5. Summarize the files changed, behavior, validation performed, and remaining decisions in clear terms.

## Git and synchronization

- Do not commit, push, publish, or otherwise synchronize project changes to GitHub until the user explicitly validates those changes or explicitly asks to synchronize/publish them.
- Local work and reviewable candidates may be prepared before that point. Preserve user changes and never force-push.

# Attention Firewall — from idea to validated demo

October 2026. This project began with a practical question: can a fast decision model judge when a notification deserves an interruption better than simple rules?

## Start with a small decision

The scope stayed deliberately narrow: simulated notifications, three delivery choices and three attention modes. A model estimates urgency, importance and interruption-worthiness. A deterministic policy keeps control of the final action. Categories describe an event; they never directly decide its delivery.

Open became the default to make the experience welcoming. Focused and Protected raise the interruption bar, while a narrow critical exception can still break through. Hidden personal signals, calendar access and notification history were excluded.

## Design before integration

The interface evolved through direct review: a compact notification component, an irregular three-card queue, authentic app icons, a restrained light palette and meaningful motion. Sending preserves the departing card's content, then receives that same event in the center. Fixed illustrative estimates allowed those interactions to be reviewed before introducing model requests.

Several refinements mattered: an empty first-arrival state, a softer card entrance, a charcoal assessment pulse and clear visual separation between ordinary Interrupt and the red critical exception. The final refinement made Later softly yellow and Disconnect slightly more visible.

## Evaluate, correct, then freeze

A bilingual synthetic corpus contained 90 semantic situations: 180 English/French records and six policy contexts. Related translations and variants stayed together when splitting authoring, development and test families. The user reviewed the pilot; most remaining labels were authored by the assistant under delegation. This was an exploratory comparison, not an independent human benchmark.

The first live development run was audited. A separate revision clarified the semantic questions, repaired the contextual baseline and revised the quiet/critical policy. Saved answers were replayed for analysis, then the user ran the revised model again. The corrected rule baseline performed better on development, an outcome kept in the review rather than hidden.

The revised configuration was frozen as `af-eval-0.2` before the final test. No tuning followed the test answers.

## What the final test showed

The audited test covered 36 bilingual records from six related families, expanded into 216 policy decisions per system.

| System | Weighted error cost ↓ | Delivery-label agreement |
| --- | ---: | ---: |
| Category rules | 1.306 | 34.3% |
| Contextual rules | 0.725 | 66.7% |
| Clef-flash + policy | 0.329 | 78.2% |

The model reduced weighted cost by about 54.6% against contextual rules on this test. All 36 model requests returned valid estimates; median provider latency was 380 ms and the 95th percentile 988 ms in that offline run.

The limitations were concrete. Four of 36 related critical decisions stayed silent, involving exposed private information and an expiring €2,000 cancellation in Protected mode with eight interruptions. The model produced 35 unnecessary interruptions versus seven for contextual rules. Only 12 of the 36 critical decisions used the explicit bypass. Development and test ranked the model and contextual rules differently.

Those counts describe this small correlated synthetic test, not a production reliability rate. Raw provider bodies and the original local test history were not supplied; model weights were not pinned by the hosted alias. The original benchmark and audit remain in private project history; this public checkout contains the demo, not a benchmark reproduction kit.

## Connect the real engine

The approved credential card lets each visitor use their own Cloudflare account. Credentials are processed only in tab/request memory, with explicit disclosure that Cloudflare receives authentication. A connection check validates access; every send then obtains real estimates using the frozen question pack. Attention changes and feedback remain local policy operations.

The first hosted attempt exposed a genuine integration mistake: Workers rejected `redirect: 'error'` before contacting Cloudflare. The server now uses manual redirects and rejects redirected responses without forwarding the token. Regression checks exercise the compiled runtime's fetch, rather than relying solely on JavaScript doubles.

The user subsequently validated connection, inference, mode changes, feedback/Undo, queue/motion, reset behavior and presentation. The queue expanded to 24 everyday and severe examples. Severe cases are deliberately clear, but their critical outcomes still depend on the real model; no preset result was added.

## What could follow

The next useful step is a fresh, independently labeled evaluation with more ambiguous cases and separate critical-recall and unnecessary-interruption reporting. More repeated runs would help assess provider variability and the two-second deadline. Any change to questions or policy should become a new version and be evaluated on fresh held-out cases.

A later model comparison or calibration study could investigate the current trade-off. Real notification integration would be a separate product stage, requiring explicit scope decisions and much stronger reliability and privacy validation. The present demo is complete within its experimental scope.

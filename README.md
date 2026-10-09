# Attention Firewall

A compact experiment in contextual interruption decisions. Connect your own Cloudflare account, send a curated notification, and see real Clef-flash estimates turned into Interrupt, Silent or Later by a deterministic policy.

[Open the demo](https://attention-firewall.smrdsh.chatgpt.site). Existing Site access restrictions apply.

## Try it

1. Enter the Account ID and Workers AI API token you used for the offline run, or create a dedicated token in Cloudflare → Workers AI → Use REST API.
2. Choose **Connect & enter demo**. This makes one small model request against your account.
3. Use **Send notification** to cycle through 24 everyday and severe examples, then compare Open, Focused and Protected. Expand **Why this decision?** for the estimates and policy path.
4. **Disconnect** or refresh to clear the connection and session state.

Credentials are kept only in the tab's memory and briefly by the backend while authenticating with Cloudflare. They are not persisted or logged by the demo. The card explains the transmission path and account usage. The demo receives no real OS notifications.

## Source and checks

| Path | Purpose |
| --- | --- |
| `frontend/index.html`, `public/` | Approved notification interface, credential card and client modules |
| `app/`, `server/` | Server document and request-local Cloudflare adapter |
| `docs/LIVE_DEMO_INTEGRATION.md` | Behavior, privacy controls and verification limits |
| `FRONTEND_BASELINE.md` | Approved visual/motion baseline and integration update |
| `offline/` | Reproducible comparison runner, frozen overlays, reports and source evidence |
| `offline/FINAL_TEST_REVIEW.md` | Audited final result and remaining critical failures |
| `PROJECT_BRIEF.md`, `AGENTS.md` | Scope and handoff instructions |

```sh
node scripts/prepare-demo.mjs
node scripts/verify-live.mjs
node scripts/verify-frontend.mjs
python3 offline/run.py --revision af-eval-0.2 verify --lock offline/final-test.lock.json
npm run build
node scripts/verify-artifact.mjs
```

Requires the starter's Node/npm environment; run `npm run install:ci` when dependencies are absent. `npm run dev` starts the local server outside the managed Sites preview environment. `dist/` is generated Worker output, not the frontend source.

## Evaluation

The frozen `af-eval-0.2` test gives Clef-flash plus policy 0.329 weighted error cost and 78.2% label agreement, versus contextual rules 0.725 and 66.7%. All 36 model requests succeeded. Four related critical decisions stayed silent; the model caused 35 unnecessary interruptions versus seven for contextual rules. This is a small synthetic exploratory comparison, with mostly assistant-authored labels.

Preserve both frozen releases and final evidence. Do not tune against test answers. The live demo uses the evaluated questions and policy unchanged, while optional session feedback is a separate interactive illustration.

# Attention Firewall

An interactive experiment in contextual interruption decisions. The approved frontend runs entirely in the browser with eight simulated notifications, three attention modes, and a deterministic policy. No model or backend is connected yet.

[Open the demo](https://attention-firewall.smrdsh.chatgpt.site) (current Site access restrictions apply).

## Run locally

Requires Python 3; there are no packages to install or build steps.

```sh
python3 -m http.server 8000 --directory dist
```

Open `http://localhost:8000`. Use HTTP rather than opening `index.html` directly, because the demo uses JavaScript modules.

## Check the frontend

Requires Node.js 18 or later; no dependencies are needed.

```sh
node scripts/verify-frontend.mjs
```

The harness checks notification identity, cold start, sending/assessment ordering, repeated-send guards, attention changes, policy outcomes, calibration/Undo, critical override, queue looping, animation cleanup, reduced motion, unsupported/canceled animation, and curved-path geometry. It does not render a browser or verify visual appearance.

## Project files

| Path | Purpose |
| --- | --- |
| `dist/` | Complete static frontend, policy, favicon, and local assets |
| `FRONTEND_BASELINE.md` | Current approved design, behavior, and limitations |
| `PROJECT_BRIEF.md` | Experiment scope and planned technical evaluation |
| `AGENTS.md` | Instructions for future work and synchronization |
| `CANDIDATE.md` | Historical design iterations |
| `ASSET_SOURCES.json` | Asset provenance |
| `.openai/hosting.json` | Existing Site identity and static output configuration; no secrets |

The frontend was approved on 2026-10-08 at Site version 24. Version 25 removes the candidate label. Model integration, the evaluation dataset, and benchmark results remain future work.

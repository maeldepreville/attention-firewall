# Attention Firewall

A small experiment in deciding which notifications deserve your attention now. **Clef-flash estimates the meaning of a notification; a deterministic policy chooses Interrupt, Silent or Later.**

The demo contains 24 simulated notifications, real model requests, three attention modes and reversible session feedback. Its compact light interface was validated through direct user testing.

[Open the hosted demo](https://attention-firewall.smrdsh.chatgpt.site) · [Read the project journey](PROJECT_JOURNEY.md)

The hosted demo currently has private access. Anyone can run this public repository locally with their own Cloudflare account.

## Run it yourself

You need Git, npm and **Node.js 22.13 or newer**. Node.js 24 was used for verification.

```sh
git clone https://github.com/maeldepreville/attention-firewall.git
cd attention-firewall
npm ci
npm run dev
```

Open **http://localhost:5173**. Keep the terminal running while you use the demo; press Ctrl+C to stop it. Open the server URL rather than opening the HTML file directly: the model connection needs the local backend.

### Get your Cloudflare credentials

In the [Cloudflare dashboard](https://dash.cloudflare.com/), open **Workers AI → Use REST API**. Create a dedicated Workers AI API token through the offered template and copy the **Account ID** for the same account. If creating a custom token, Cloudflare's [REST API guide](https://developers.cloudflare.com/workers-ai/get-started/rest-api/) specifies Workers AI Read and Edit permissions. Restrict the token to the account you will use.

Enter the Account ID and token in the demo's first screen, then choose **Connect & enter demo**. You do not need to put either value in a file, environment variable or source code. The token must have access to `@cf/cloudflare/clef-flash`.

Connecting makes one small model request. Each **Send notification** makes another request against your account's Workers AI quota; Cloudflare's usage limits and charges apply.

### What to try

1. Send a notification. The front queued card becomes the central notification, followed by its decision.
2. Switch between **Open, Focused and Protected**. This reapplies policy without another model call or changing the semantic estimates. Some events keep the same outcome in every mode.
3. Expand **Why this decision?** and its technical details to inspect the estimates and policy path.
4. Try feedback and **Undo**. Corrections change only the current session's category adjustment; they do not train the model.
5. Try examples **9, 11, 19 and 21** in Protected mode for clear severe incidents. A critical result depends on the actual model estimates and is never guaranteed by an example.
6. **Disconnect** or refresh to clear the connection and reset the session. The queue loops after all 24 examples.

## How decisions work

Only notification text, source, category and grounded timestamps reach the model. Display sender, attention mode, interruption count, feedback and previous notifications stay outside model input.

The three estimates are urgency, importance and intrinsic interruption probability. Policy uses Open / Focused / Protected baselines of 0.58 / 0.72 / 0.86, session interruption pressure and optional feedback. A critical bypass requires **urgency ≥ 0.75 and importance ≥ 0.95**. Otherwise a notification interrupts when its interruption probability reaches the current threshold; useful quieter events stay Silent, and low-severity events go to Later. The quiet severity boundary is 1/3.

The evaluated `af-eval-0.2` question pack and policy retain their original content. Build preparation checks their SHA-256 hashes after normalizing Windows CRLF line endings to LF; other changes still fail the check. A provider failure produces **Silent with unavailable estimates**, rather than invented scores. Requests have a two-second provider deadline, one attempt and no automatic retries.

## Credentials and privacy

Credentials stay in the current tab's memory and briefly in request-local backend memory. The fields are cleared on submission. Disconnect, refresh and leaving the page clear the connection; pending requests are canceled and late responses rejected.

The application does not persist credentials in browser storage, cookies, files, environment settings, databases or caches, and does not log them. Worker application observability is disabled. Locally, authentication travels through your local backend and then to Cloudflare over HTTPS; on the hosted demo, both hops use HTTPS. Cloudflare must receive the token to authenticate. Hosting infrastructure and browser extensions are outside the application's control.

## Checks and production build

```sh
npm test
npm run build
npm run test:build
npm start
```

`npm test` checks LF/CRLF preparation, rejection of changed frozen payloads, policy boundaries, response validation, credential lifecycle and all 24 events through four motion scenarios. `test:build` exercises the compiled Worker with mocked provider responses, including successful inference, credential rejection and refusing redirects. These checks require no real token. After building, `npm start` serves the compiled app locally at **http://127.0.0.1:8787**.

A clean install, build and compiled-runtime checks were verified on Linux with Node.js 24. Browser automation was unavailable; visual and live-account acceptance came from user testing. This is a demo, not an OS notification integration or a safety guarantee.

## Repository map

| Path | Purpose |
| --- | --- |
| `frontend/`, `public/` | Approved markup, styles, interactions and local icons |
| `app/`, `server/` | Document/API routes, Cloudflare adapter and evaluated configuration |
| `build/`, `vite.config.ts` | Worker build and required Sites integration |
| `scripts/` | Build preparation, runtime checks and portable/managed build helpers |
| `ASSET_SOURCES.json` | Sources for third-party icons and the supplied send mark |
| `PROJECT_JOURNEY.md` | Development, evaluation results, limitations and next directions |

`dist/` is generated and ignored. The old offline runner, datasets and working documents are outside this demo checkout and remain in private project history. No model scores, policy thresholds or interface behavior were changed during repository cleanup. The hosted Site configuration belongs to this project's existing deployment; use your own project configuration when deploying a fork.

App names and icons belong to their respective owners. Their use illustrates simulated notifications and does not imply endorsement. The vendored Sites plugin retains its MIT license in `build/sites-vite-plugin.LICENSE`.

## Troubleshooting

| Symptom | What to check |
| --- | --- |
| Connection rejected | Account ID, token, matching account scope and Workers AI permissions |
| Usage limit reached | Your Cloudflare account's quota/rate limit; try again later |
| Timeout or unavailable assessment | Network/provider availability; the notification remains available quietly |
| Unexpected response format | The hosted Clef-flash response may have changed; validation deliberately refuses it |
| Old colors or examples after a hosted update | Refresh with Ctrl+Shift+R |
| Local page or API unavailable | Keep `npm run dev` running and use its URL; confirm your Node version and run `npm ci` |
| `Evaluated demo payload drift` on an older Windows clone | Run `git pull` then `npm run dev`. The update handles Windows line endings without changing the evaluated content. If it still fails, check for local edits to `server/frozen/`; do not bypass the integrity check. |

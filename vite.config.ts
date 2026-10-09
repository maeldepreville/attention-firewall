import vinext from 'vinext';
import { defineConfig } from 'vite';
import { readExecutionProfile } from './scripts/execution-profile.mjs';
import { sites } from './build/sites-vite-plugin';

const managedLinux = readExecutionProfile() === 'managed-linux';

export default defineConfig(async () => {
  process.env.CLOUDFLARE_CF_FETCH_ENABLED ??= 'false';
  process.env.WRANGLER_SEND_METRICS ??= 'false';
  process.env.WRANGLER_WRITE_LOGS ??= 'false';
  process.env.WRANGLER_LOG_PATH ??= '.wrangler/logs';
  process.env.WRANGLER_REGISTRY_PATH ??= '.wrangler/dev-registry';
  process.env.MINIFLARE_REGISTRY_PATH ??= '.wrangler/registry';
  const { cloudflare } = await import('@cloudflare/vite-plugin');
  return {
    server: {
      ...(managedLinux ? { host: '0.0.0.0', allowedHosts: ['terminal.local'] } : {}),
      ...(process.env.CODEX_SANDBOX === 'seatbelt' ? { watch: { useFsEvents: false, usePolling: true } } : {}),
    },
    plugins: [
      vinext(),
      sites({ mockAuth: !managedLinux }),
      cloudflare({
        viteEnvironment: { name: 'rsc', childEnvironments: ['ssr'] },
        inspectorPort: false,
        config: {
          main: './build/sites-worker.ts',
          compatibility_date: '2026-05-15',
          compatibility_flags: ['nodejs_compat'],
          observability: { enabled: false, logs: { enabled: false }, traces: { enabled: false } },
        },
      }),
    ],
  };
});

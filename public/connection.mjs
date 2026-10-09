// Credentials live only in this module's closures. No storage, cookies or logs.
export function createConnection(fetcher = (...args) => fetch(...args)) {
  let credentials = null, generation = 0;
  const pending = new Set();
  function disconnect() {
    generation++;
    credentials = null;
    for (const controller of pending) controller.abort();
    pending.clear();
  }
  async function post(path, payload, secret, version) {
    const controller = new AbortController();
    pending.add(controller);
    const timer = setTimeout(() => controller.abort(), 8000);
    try {
      const response = await fetcher(path, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...payload, credentials: secret }),
        signal: controller.signal, cache: 'no-store', credentials: 'same-origin', redirect: 'error', referrerPolicy: 'no-referrer'
      });
      if (version !== generation) throw new Error('disconnected');
      let value; try { value = await response.json(); } catch { throw new Error('service_unavailable'); }
      if (version !== generation) throw new Error('disconnected');
      if (!response.ok) throw new Error(['credentials_rejected','rate_limited','deadline_exceeded','invalid_response','invalid_request','request_rejected'].includes(value.error) ? value.error : 'service_unavailable');
      return value;
    } catch (error) {
      if (version !== generation) throw new Error('disconnected');
      throw new Error(['credentials_rejected','rate_limited','deadline_exceeded','invalid_response','invalid_request','request_rejected','service_unavailable'].includes(error?.message) ? error.message : controller.signal.aborted ? 'deadline_exceeded' : 'service_unavailable');
    } finally {
      clearTimeout(timer); pending.delete(controller); secret = null; payload = null;
    }
  }
  return {
    get connected() { return credentials !== null; },
    disconnect,
    async connect(accountId, token) {
      disconnect();
      const version = generation;
      if (!/^[a-fA-F0-9]{32}$/.test(accountId) || !/^[\x21-\x7e]{16,512}$/.test(token)) throw new Error('invalid_credentials');
      let secret = { accountId, token };
      try {
        const value = await post('/api/connect', {}, secret, version);
        if (value.status !== 'ok') throw new Error('service_unavailable');
        if (version !== generation) throw new Error('disconnected');
        credentials = secret;
      } finally { secret = null; accountId = null; token = null; }
    },
    async assess(state, context, calibration) {
      if (!credentials) throw new Error('disconnected');
      const version = generation;
      const value = await post('/api/assess', { state, context, calibration }, credentials, version);
      if (value.release !== 'af-eval-0.2' || value.model !== 'clef-flash' || !['ok','timeout','provider_error','invalid_output','canceled'].includes(value.status)) throw new Error('invalid_response');
      if (value.status === 'ok') {
        if (!value.estimates || !['urgency','importance','interrupt_worthy'].every(k => typeof value.estimates[k] === 'number' && Number.isFinite(value.estimates[k]) && value.estimates[k] >= 0 && value.estimates[k] <= 1)) throw new Error('invalid_response');
      } else if (value.estimates !== null) throw new Error('invalid_response');
      return { status: value.status, error: value.error, estimates: value.estimates, provider_ms: value.provider_ms };
    }
  };
}

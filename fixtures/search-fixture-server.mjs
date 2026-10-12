import http from 'node:http';
import { URL } from 'node:url';

const VALID_MODES = new Set([
  'happy',
  'ui-no-request',
  'transport-timeout',
  'http-server-error',
  'http-rate-limit',
  'access-challenge',
  'render-crash',
  'semantic-empty',
  'stale-state',
]);

const RESULT_SET = [
  { title: 'Browser automation', url: '/results/browser-automation' },
  { title: 'Retrieval diagnostics', url: '/results/retrieval-diagnostics' },
];

function sendJson(response, status, body, headers = {}) {
  const payload = JSON.stringify(body);
  response.writeHead(status, {
    'content-type': 'application/json; charset=utf-8',
    'cache-control': 'no-store',
    ...headers,
  });
  response.end(payload);
}

function renderSearchPage(mode) {
  const safeMode = JSON.stringify(mode);
  return `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <title>Retrieval Failure Fixture</title>
    <style>
      :root { color-scheme: light; font-family: system-ui, sans-serif; }
      body { max-width: 720px; margin: 48px auto; padding: 0 24px; color: #182235; }
      form { display: flex; gap: 8px; }
      input, button { font: inherit; padding: 10px 12px; }
      input { flex: 1; }
      button { cursor: pointer; }
      #status { min-height: 1.5em; margin: 20px 0 8px; }
      #results { padding-left: 20px; }
      [data-kind="error"] { color: #a1271c; }
      [data-kind="ok"] { color: #146b3a; }
      .meta { color: #647084; font-size: 0.9rem; }
    </style>
  </head>
  <body data-mode=${safeMode}>
    <h1>Retrieval Failure Fixture</h1>
    <p class="meta">mode: <code id="mode"></code></p>
    <form id="search-form">
      <label for="query">Query</label>
      <input id="query" name="query" value="browser" autocomplete="off">
      <button type="submit">Search</button>
    </form>
    <p id="status" role="status" aria-live="polite"></p>
    <ul id="results"></ul>
    <script>
      const mode = ${safeMode};
      const telemetry = {
        mode,
        requestAttempted: false,
        requestUrl: null,
        transportError: null,
        httpStatus: null,
        responseHeaders: {},
        challengeMarker: false,
        staleState: false,
        semanticMismatch: false,
        resultCount: null,
        uiUpdated: false,
      };
      window.__retrievalTelemetry = telemetry;
      document.querySelector('#mode').textContent = mode;
      const form = document.querySelector('#search-form');
      const queryInput = document.querySelector('#query');
      const status = document.querySelector('#status');
      const results = document.querySelector('#results');

      function setStatus(text, kind, countsAsResultUpdate = true) {
        status.textContent = text;
        status.dataset.kind = kind || '';
        if (countsAsResultUpdate) telemetry.uiUpdated = true;
      }

      function render(items) {
        results.replaceChildren();
        for (const item of items) {
          const li = document.createElement('li');
          li.textContent = item.title + ' (' + item.url + ')';
          results.append(li);
        }
      }

      form.addEventListener('submit', async (event) => {
        event.preventDefault();
        telemetry.requestAttempted = false;
        telemetry.requestUrl = null;
        telemetry.transportError = null;
        telemetry.httpStatus = null;
        telemetry.responseHeaders = {};
        telemetry.challengeMarker = false;
        telemetry.staleState = false;
        telemetry.semanticMismatch = false;
        telemetry.resultCount = null;
        telemetry.uiUpdated = false;
        render([]);
        setStatus('Searching…', '', false);

        if (mode === 'ui-no-request') {
          setStatus('No request dispatched', 'error');
          return;
        }

        const query = queryInput.value;
        telemetry.requestAttempted = true;
        telemetry.requestUrl = '/api/search?mode=' + encodeURIComponent(mode) + '&q=' + encodeURIComponent(query);
        try {
          const response = await fetch(telemetry.requestUrl, {
            signal: AbortSignal.timeout(250),
          });
          telemetry.httpStatus = response.status;
          telemetry.responseHeaders = {
            'content-type': response.headers.get('content-type'),
            'retry-after': response.headers.get('retry-after'),
            'x-search-challenge': response.headers.get('x-search-challenge'),
          };

          if (!response.ok) {
            setStatus('HTTP ' + response.status, 'error');
            return;
          }

          const payload = await response.json();
          telemetry.challengeMarker = Boolean(payload.challenge);
          telemetry.staleState = Boolean(payload.staleState);
          telemetry.semanticMismatch = Boolean(payload.semanticMismatch);
          telemetry.resultCount = Array.isArray(payload.results) ? payload.results.length : null;

          if (mode === 'render-crash') {
            console.error('fixture render failure after successful response');
            throw new Error('fixture render failure');
          }
          if (telemetry.staleState) {
            setStatus('Stale state detected; old results retained', 'error');
            return;
          }
          if (telemetry.challengeMarker) {
            setStatus('Access challenge returned', 'error');
            return;
          }
          render(payload.results || []);
          if (telemetry.semanticMismatch) {
            setStatus('Semantic mismatch: zero results', 'error');
            return;
          }
          setStatus(String(telemetry.resultCount) + ' result(s)', 'ok');
        } catch (error) {
          if (!telemetry.httpStatus) {
            telemetry.transportError = error.name === 'TimeoutError' || error.name === 'AbortError'
              ? 'timeout'
              : error.message;
          }
          if (telemetry.transportError) {
            setStatus('Transport error: ' + telemetry.transportError, 'error');
          }
        }
      });
    </script>
  </body>
</html>`;
}

function handleSearch(response, mode, query) {
  if (mode === 'transport-timeout') {
    setTimeout(() => {
      sendJson(response, 200, { query, results: RESULT_SET, requestId: 'late-response' });
    }, 700);
    return;
  }
  if (mode === 'http-server-error') {
    sendJson(response, 503, { error: 'fixture service unavailable' });
    return;
  }
  if (mode === 'http-rate-limit') {
    sendJson(response, 429, { error: 'fixture rate limited' }, { 'retry-after': '3' });
    return;
  }
  if (mode === 'access-challenge') {
    sendJson(response, 200, { challenge: true, results: [] }, { 'x-search-challenge': 'fixture-challenge' });
    return;
  }
  if (mode === 'semantic-empty') {
    sendJson(response, 200, { query, results: [], semanticMismatch: true });
    return;
  }
  if (mode === 'stale-state') {
    sendJson(response, 200, {
      query,
      results: [{ title: 'Old result', url: '/results/old' }],
      requestId: 'old-request-001',
      staleState: true,
    });
    return;
  }
  sendJson(response, 200, { query, results: RESULT_SET, requestId: 'fresh-request-001' });
}

export function createFixtureServer() {
  const server = http.createServer((request, response) => {
    const requestUrl = new URL(request.url || '/', 'http://127.0.0.1');
    if (requestUrl.pathname === '/health') {
      sendJson(response, 200, { ok: true });
      return;
    }
    if (requestUrl.pathname === '/') {
      const mode = requestUrl.searchParams.get('mode') || 'happy';
      if (!VALID_MODES.has(mode)) {
        sendJson(response, 400, { error: 'unknown fixture mode' });
        return;
      }
      response.writeHead(200, { 'content-type': 'text/html; charset=utf-8', 'cache-control': 'no-store' });
      response.end(renderSearchPage(mode));
      return;
    }
    if (requestUrl.pathname === '/api/search') {
      const mode = requestUrl.searchParams.get('mode') || 'happy';
      const query = requestUrl.searchParams.get('q') || '';
      handleSearch(response, mode, query);
      return;
    }
    response.writeHead(404, { 'content-type': 'text/plain; charset=utf-8' });
    response.end('not found');
  });

  return {
    async listen(port = 0) {
      await new Promise((resolve, reject) => {
        server.once('error', reject);
        server.listen(port, '127.0.0.1', resolve);
      });
      const address = server.address();
      return `http://127.0.0.1:${address.port}`;
    },
    async close() {
      if (!server.listening) return;
      await new Promise((resolve, reject) => server.close((error) => (error ? reject(error) : resolve())));
    },
  };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const fixture = createFixtureServer();
  const url = await fixture.listen(Number(process.env.PORT) || 4173);
  console.log(`fixture listening at ${url}`);
}
